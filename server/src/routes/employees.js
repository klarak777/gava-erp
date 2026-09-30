const express = require('express');
const router = express.Router();
const db = require('../db/db');
const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'erp-secret-key';

// Middleware: Hitelesítés és jogosultság-ellenőrzés
function verifyAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  // Tesztüzemi kapcsoló (későbbi élesítéshez)
  if (process.env.REQUIRE_AUTH !== 'true') {
    if (!token || token.startsWith('mock-')) {
      req.user = { id: 1, role: 'Admin', name: 'Teszt Admin' };
      return next();
    }
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    if (req.user.role !== 'Admin') {
       return res.status(403).json({ error: 'Nincs jogosultság a dolgozók kezeléséhez.' });
    }
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Érvénytelen vagy lejárt token.' });
  }
}

router.use(verifyAuth);

// GET all employees
router.get('/', async (req, res) => {
  try {
    const search = req.query.search;
    let query = db('employees').select('id', 'full_name', 'join_date', 'department', 'site', 'status', 'role').orderBy('id', 'desc');
    
    if (search) {
      query = query.where('full_name', 'ilike', `%${search}%`)
                   .orWhereRaw('id::text ilike ?', [`%${search}%`]);
    }
    const employees = await query;
    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba a dolgozók betöltésekor.' });
  }
});

// GET single employee
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    // Exclude password_hash
    const employee = await db('employees')
      .where({ id })
      .select('id', 'full_name', 'birth_date', 'birth_place', 'mother_name', 'gender', 'citizenship', 
              'marital_status', 'children_count', 'phone', 'email', 'taj_number', 'tax_number', 
              'bank_account', 'job_title', 'department', 'site', 'employment_type', 'join_date', 
              'probation_end', 'employment_nature', 'work_hours', 'classification', 'classification_level', 
              'business_email', 'internal_phone', 'status', 'username', 'pda_identifier', 'role', 
              'address_country', 'address_zip', 'address_city', 'address_street', 'address_type', 
              'address_number', 'address_building', 'created_at', 'updated_at')
      .first();
      
    if (!employee) return res.status(404).json({ error: 'Dolgozó nem található.' });
    
    employee.educations = await db('employee_educations').where({ employee_id: id });
    employee.languages = await db('employee_languages').where({ employee_id: id });
    employee.documents = await db('employee_documents').where({ employee_id: id });
    employee.devices = await db('employee_devices').where({ employee_id: id });
    employee.permissions = await db('employee_module_permissions').where({ employee_id: id });
    employee.history = await db('employee_history').where({ employee_id: id }).orderBy('event_time', 'desc');
    
    res.json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba a dolgozó betöltésekor.' });
  }
});

// CREATE employee
router.post('/', async (req, res) => {
  try {
    const { educations, languages, permissions, password_hash, ...employeeData } = req.body;
    let newEmployee = null;
    
    if (password_hash) {
      const salt = await bcrypt.genSalt(10);
      employeeData.password_hash = await bcrypt.hash(password_hash, salt);
    }
    
    await db.transaction(async trx => {
      [newEmployee] = await trx('employees').insert(employeeData).returning('*');
      
      if (educations && educations.length) {
        const eduData = educations.map(e => ({ ...e, employee_id: newEmployee.id }));
        await trx('employee_educations').insert(eduData);
      }
      if (languages && languages.length) {
        const langData = languages.map(l => ({ ...l, employee_id: newEmployee.id }));
        await trx('employee_languages').insert(langData);
      }
      if (permissions && permissions.length) {
        const permData = permissions.map(p => ({ ...p, employee_id: newEmployee.id }));
        await trx('employee_module_permissions').insert(permData);
      }
      
      await trx('employee_history').insert({
        employee_id: newEmployee.id,
        event_category: 'SYSTEM',
        event_type: 'Dolgozó létrehozása',
        module_or_function: 'Dolgozók',
        details: 'Új profil',
        ip_address: req.ip,
        operator_name: req.user.name || 'Rendszer'
      });
    });
    
    delete newEmployee.password_hash;
    res.json(newEmployee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba a létrehozás során.' });
  }
});

// UPDATE employee
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { educations, languages, permissions, password_hash, ...employeeData } = req.body;
    
    if (password_hash) {
      const salt = await bcrypt.genSalt(10);
      employeeData.password_hash = await bcrypt.hash(password_hash, salt);
    }
    
    await db.transaction(async trx => {
      if (Object.keys(employeeData).length > 0) {
        await trx('employees').where({ id }).update({ ...employeeData, updated_at: db.fn.now() });
      }
      
      if (educations !== undefined) {
        await trx('employee_educations').where({ employee_id: id }).del();
        if (educations.length) {
          await trx('employee_educations').insert(educations.map(e => ({ ...e, employee_id: id })));
        }
      }
      if (languages !== undefined) {
        await trx('employee_languages').where({ employee_id: id }).del();
        if (languages.length) {
          await trx('employee_languages').insert(languages.map(l => ({ ...l, employee_id: id })));
        }
      }
      if (permissions !== undefined) {
        await trx('employee_module_permissions').where({ employee_id: id }).del();
        if (permissions.length) {
          await trx('employee_module_permissions').insert(permissions.map(p => ({ ...p, employee_id: id })));
        }
      }
      
      await trx('employee_history').insert({
        employee_id: id,
        event_category: 'SYSTEM',
        event_type: 'Adatok frissítése',
        module_or_function: 'Dolgozók',
        details: 'Profil szerkesztve',
        ip_address: req.ip,
        operator_name: req.user.name || 'Rendszer'
      });
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba a mentés során.' });
  }
});

// CREATE device
router.post('/:id/devices', async (req, res) => {
  try {
    const id = req.params.id;
    const { device_type, identifier, issue_date, notes, status } = req.body;
    let newDevice = null;
    await db.transaction(async trx => {
      [newDevice] = await trx('employee_devices').insert({
        employee_id: id, device_type, identifier, issue_date: issue_date || null, notes, status: status || 'Aktív'
      }).returning('*');
      
      await trx('employee_history').insert({
        employee_id: id,
        event_category: 'DEVICE',
        event_type: 'Eszköz kiosztása',
        module_or_function: device_type,
        details: identifier,
        ip_address: req.ip,
        operator_name: req.user.name || 'Rendszer'
      });
    });
    res.json(newDevice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba az eszköz mentésekor.' });
  }
});

// UPDATE device
router.put('/:id/devices/:deviceId', async (req, res) => {
  try {
    const { id, deviceId } = req.params;
    const { device_type, identifier, issue_date, status, notes } = req.body;
    
    let updatedDevice = null;
    await db.transaction(async trx => {
      [updatedDevice] = await trx('employee_devices').where({ id: deviceId, employee_id: id }).update({
        device_type, identifier, issue_date: issue_date || null, status, notes, updated_at: db.fn.now()
      }).returning('*');
      
      await trx('employee_history').insert({
        employee_id: id,
        event_category: 'DEVICE',
        event_type: 'Eszköz szerkesztése',
        module_or_function: device_type,
        details: `${identifier} - ${status}`,
        ip_address: req.ip,
        operator_name: req.user.name || 'Rendszer'
      });
    });
    res.json(updatedDevice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba az eszköz szerkesztésekor.' });
  }
});

// DELETE device (withdraw)
router.delete('/:id/devices/:deviceId', async (req, res) => {
  try {
    const { id, deviceId } = req.params;
    await db.transaction(async trx => {
      const device = await trx('employee_devices').where({ id: deviceId, employee_id: id }).first();
      if (!device) throw new Error('Eszköz nem található.');
      
      await trx('employee_devices').where({ id: deviceId }).update({ status: 'Visszavont', updated_at: db.fn.now() });
      
      await trx('employee_history').insert({
        employee_id: id,
        event_category: 'DEVICE',
        event_type: 'Eszköz visszavonása',
        module_or_function: device.device_type,
        details: device.identifier,
        ip_address: req.ip,
        operator_name: req.user.name || 'Rendszer'
      });
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hiba az eszköz törlésekor.' });
  }
});

module.exports = router;
