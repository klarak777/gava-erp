exports.up = function(knex) {
  return knex.schema
    .createTable('employees', table => {
      table.increments('id').primary();
      
      // 1. Munkaügyi adatok
      table.string('full_name').notNullable();
      table.date('birth_date');
      table.string('birth_place');
      table.string('mother_name');
      table.string('gender');
      table.string('citizenship');
      table.string('marital_status');
      table.integer('children_count').defaultTo(0);
      table.string('address');
      table.string('phone');
      table.string('email');
      table.string('taj_number');
      table.string('tax_number');
      table.string('bank_account');
      
      // 2. Munkavállaló profil
      table.string('job_title');
      table.string('department');
      table.string('site');
      table.string('employment_type');
      table.date('join_date');
      table.date('probation_end');
      table.string('employment_nature');
      table.decimal('work_hours', 5, 2);
      table.string('classification');
      table.string('classification_level');
      table.string('business_email');
      table.string('internal_phone');
      
      // Állapot
      table.string('status').defaultTo('Aktív');
      
      // Bejelentkezési adatok
      table.string('username').unique();
      table.string('password_hash');
      table.string('pda_identifier').unique(); // PDA vonalkód
      table.string('role').defaultTo('Felhasználó'); // Admin vagy Felhasználó
      
      table.timestamps(true, true);
    })
    .createTable('employee_educations', table => {
      table.increments('id').primary();
      table.integer('employee_id').unsigned().references('id').inTable('employees').onDelete('CASCADE');
      table.string('institution');
      table.string('degree');
      table.string('year');
      table.timestamps(true, true);
    })
    .createTable('employee_languages', table => {
      table.increments('id').primary();
      table.integer('employee_id').unsigned().references('id').inTable('employees').onDelete('CASCADE');
      table.string('language');
      table.string('level');
      table.timestamps(true, true);
    })
    .createTable('employee_documents', table => {
      table.increments('id').primary();
      table.integer('employee_id').unsigned().references('id').inTable('employees').onDelete('CASCADE');
      table.string('file_name');
      table.string('file_path');
      table.timestamp('upload_date').defaultTo(knex.fn.now());
    })
    .createTable('employee_devices', table => {
      table.increments('id').primary();
      table.integer('employee_id').unsigned().references('id').inTable('employees').onDelete('CASCADE');
      table.string('device_type').notNullable(); // Belépő kártya, Szekrény kulcs, PDA készülék, Egyedi
      table.string('identifier').notNullable();
      table.date('issue_date');
      table.string('status').defaultTo('Aktív'); // Aktív, Lejárt, Visszavont
      table.text('notes');
      table.timestamps(true, true);
    })
    .createTable('employee_module_permissions', table => {
      table.increments('id').primary();
      table.integer('employee_id').unsigned().references('id').inTable('employees').onDelete('CASCADE');
      table.string('module_name').notNullable();
      table.boolean('has_access').defaultTo(false);
      table.string('access_level').defaultTo('Olvasás'); // Olvasás, Írás, Teljes
      table.text('notes');
      table.unique(['employee_id', 'module_name']);
    })
    .createTable('employee_history', table => {
      table.increments('id').primary();
      table.integer('employee_id').unsigned().references('id').inTable('employees').onDelete('CASCADE');
      table.timestamp('event_time').defaultTo(knex.fn.now());
      table.string('event_category').notNullable(); // 'DEVICE', 'SYSTEM'
      table.string('event_type').notNullable(); // pl. Eszköz kiosztása, Hozzáférés létrehozása, Bejelentkezés
      table.string('module_or_function'); // Eszközöknél device_type, rendszernél modul neve
      table.string('details'); // Azonosító vagy egyéb részletek
      table.string('ip_address');
      table.string('operator_name'); // Műveletet végző
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('employee_history')
    .dropTableIfExists('employee_module_permissions')
    .dropTableIfExists('employee_devices')
    .dropTableIfExists('employee_documents')
    .dropTableIfExists('employee_languages')
    .dropTableIfExists('employee_educations')
    .dropTableIfExists('employees');
};
