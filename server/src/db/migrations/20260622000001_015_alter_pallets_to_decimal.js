exports.up = async function(knex) {
  // Drop view before altering columns
  await knex.raw('DROP VIEW IF EXISTS v_shipment_costs;');

  await knex.schema
    .alterTable('shipment_lines', table => {
      table.decimal('euro_palets', 10, 2).alter();
      table.decimal('normal_palets', 10, 2).alter();
    })
    .alterTable('cargo_demands', table => {
      table.decimal('euro_palets', 10, 2).alter();
      table.decimal('normal_palets', 10, 2).alter();
    });

  // Recreate view
  await knex.raw(`
    CREATE VIEW v_shipment_costs AS
    WITH shipment_totals AS (
        SELECT
            sl.shipment_id,
            SUM(sl.euro_palets) AS sum_euro,
            SUM(sl.normal_palets) AS sum_normal,
            -- Egyszeri átváltás a váltótáblából
            COALESCE(pc.euro_equivalent, 0) AS converted_normal_to_euro
        FROM shipment_lines sl
        LEFT JOIN pallet_conversion pc ON pc.normal_count = (
            SELECT SUM(sl2.normal_palets) FROM shipment_lines sl2 WHERE sl2.shipment_id = sl.shipment_id
        )
        GROUP BY sl.shipment_id, pc.euro_equivalent
    ),
    shipment_grand AS (
        SELECT
            shipment_id,
            sum_euro,
            sum_normal,
            converted_normal_to_euro,
            (sum_euro + converted_normal_to_euro) AS grand_total_palets
        FROM shipment_totals
    )
    SELECT
        sl.id AS line_id,
        sl.shipment_id,
        s.order_number,
        -- Soronkénti Total Palets
        CASE
            WHEN sg.sum_normal = 0 THEN sl.euro_palets
            ELSE sl.euro_palets + (sg.converted_normal_to_euro * (sl.normal_palets::numeric / NULLIF(sg.sum_normal, 0)))
        END AS calculated_total_palets,
        -- Transport Cost per sor
        CASE
            WHEN sg.grand_total_palets = 0 THEN 0
            ELSE s.transport_price * (
                CASE
                    WHEN sg.sum_normal = 0 THEN sl.euro_palets
                    ELSE sl.euro_palets + (sg.converted_normal_to_euro * (sl.normal_palets::numeric / NULLIF(sg.sum_normal, 0)))
                END / sg.grand_total_palets
            )
        END AS calculated_transport_cost
    FROM shipment_lines sl
    JOIN shipments s ON s.id = sl.shipment_id
    JOIN shipment_grand sg ON sg.shipment_id = sl.shipment_id;
  `);
};

exports.down = async function(knex) {
  await knex.raw('DROP VIEW IF EXISTS v_shipment_costs;');

  await knex.schema
    .alterTable('shipment_lines', table => {
      table.integer('euro_palets').alter();
      table.integer('normal_palets').alter();
    })
    .alterTable('cargo_demands', table => {
      table.integer('euro_palets').alter();
      table.integer('normal_palets').alter();
    });

  await knex.raw(`
    CREATE VIEW v_shipment_costs AS
    WITH shipment_totals AS (
        SELECT
            sl.shipment_id,
            SUM(sl.euro_palets) AS sum_euro,
            SUM(sl.normal_palets) AS sum_normal,
            -- Egyszeri átváltás a váltótáblából
            COALESCE(pc.euro_equivalent, 0) AS converted_normal_to_euro
        FROM shipment_lines sl
        LEFT JOIN pallet_conversion pc ON pc.normal_count = (
            SELECT SUM(sl2.normal_palets) FROM shipment_lines sl2 WHERE sl2.shipment_id = sl.shipment_id
        )
        GROUP BY sl.shipment_id, pc.euro_equivalent
    ),
    shipment_grand AS (
        SELECT
            shipment_id,
            sum_euro,
            sum_normal,
            converted_normal_to_euro,
            (sum_euro + converted_normal_to_euro) AS grand_total_palets
        FROM shipment_totals
    )
    SELECT
        sl.id AS line_id,
        sl.shipment_id,
        s.order_number,
        -- Soronkénti Total Palets
        CASE
            WHEN sg.sum_normal = 0 THEN sl.euro_palets
            ELSE sl.euro_palets + (sg.converted_normal_to_euro * (sl.normal_palets::numeric / NULLIF(sg.sum_normal, 0)))
        END AS calculated_total_palets,
        -- Transport Cost per sor
        CASE
            WHEN sg.grand_total_palets = 0 THEN 0
            ELSE s.transport_price * (
                CASE
                    WHEN sg.sum_normal = 0 THEN sl.euro_palets
                    ELSE sl.euro_palets + (sg.converted_normal_to_euro * (sl.normal_palets::numeric / NULLIF(sg.sum_normal, 0)))
                END / sg.grand_total_palets
            )
        END AS calculated_transport_cost
    FROM shipment_lines sl
    JOIN shipments s ON s.id = sl.shipment_id
    JOIN shipment_grand sg ON sg.shipment_id = sl.shipment_id;
  `);
};
