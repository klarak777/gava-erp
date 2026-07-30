require('dotenv').config();
const db = require('knex')(require('./knexfile')['development']);

async function main() {
  console.log('=== DUPLIKÁLT AZONOSÍTÓK JAVÍTÁSA KÜLÖNBÖZŐ PARTNEREK KÖZÖTT ===');

  // Inaktívra tesszük azokat, amelyek vélhetően hibás összerendelések
  const toDeactivate = [
    5572, // Customer DG69 -> Partner: DG69 (6958) (helyette DG 69 d.o.o marad)
    5562, // Reference DG69 -> Partner: DG69 (6958)
    5553, // Reference EUROGROUP ESPANA -> Partner: EUROGROUP ESPANA (31) (helyette EUROGROUP ESPANA FRUTAS Y VERDURAS S.A.U. marad)
    5571, // Customer GAVA -> Partner: FRUTAS GAVA (helyette GAVA TXEQUIA marad)
    5585, // Fuvarozó GAVA -> Partner: FRUTAS GAVA (helyette GAVA TXEQUIA marad)
    5546, // Reference SMART -> Partner: BRAVOSMART Kft (helyette Smart Fruits S.L. marad)
    5582, // Fuvarozó BOGNÁR -> Partner: Bognárné Gyöngyösi Enikő (helyette Bognár Transport marad)
    5583  // Fuvarozó RONI -> Partner: Békési Veronika (helyette Roni Cargo Kft marad)
  ];

  for (const id of toDeactivate) {
    await db('partner_identifiers').where({ id }).update({ is_inactive: true });
    console.log(`Deaktivált pi_id: ${id}`);
  }

  console.log('Kész.');
  await db.destroy();
}

main().catch(e => { console.error(e); process.exit(1); });
