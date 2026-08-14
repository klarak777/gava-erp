export const NAV_CATEGORIES = [
    {
        id: 'iroda',
        label: 'IRODA',
        groups: [
            { id: 'menedzser', title: 'Menedzser', icon: '👔', moduleId: 'menedzser', items: [] },
            { id: 'logisztika', title: 'Logisztika', icon: '📦', moduleId: 'logisztika', items: [] },
            { id: 'partnerek', title: 'Partnerek', icon: '🤝', moduleId: 'partnerek', items: [] }
        ],
    },
    {
        id: 'fuvarok',
        label: 'FUVAROK',
        groups: [
            { id: 'rakodas', title: 'Rakodás', icon: '🏗️', moduleId: 'rakodas', items: [] },
            { id: 'fuvarmegbizas', title: 'Fuvarmegbizás', icon: '📝', moduleId: 'fuvarmegbizas', items: [] },
            { id: 'ekaerek', title: 'EKAEREK', icon: '🛂', moduleId: 'ekaerek', items: [] },
            { id: 'transportistas', title: 'Transportistas', icon: '🚚', moduleId: 'transportistas', items: [] },
            { id: 'order_number', title: 'Order number', icon: '🔢', moduleId: 'order_number', items: [] },
            { id: 'fuvarok_osszesito', title: 'Fuvarok összesitö', icon: '📋', moduleId: 'fuvarok', items: [] },
            { id: 'felrakok', title: 'Felrakók', icon: '🏭', moduleId: 'felrakok', items: [] },
            { id: 'termekek_adat_tabla', title: 'Termékek adat tábla', icon: '📊', moduleId: 'termekek_adat_tabla', items: [] },
            { id: 'cimke', title: 'Címke', icon: '🏷️', moduleId: 'cimke', items: [] },
        ],
    },
    {
        id: 'admin',
        label: 'ADMIN',
        groups: [
            {
                id: 'admin_module',
                title: 'Rendszer (Admin)',
                icon: '⚙️',
                moduleId: 'admin',
                items: [
                    { id: 'admin-references', label: 'Reference', icon: '🏢', desc: 'Szállítók / Partnerek' },
                    { id: 'admin-customers', label: 'Customer', icon: '🛒', desc: 'Vevők' },
                    { id: 'admin-transporters', label: 'Fuvarozó cég', icon: '🚚', desc: 'Fuvarozók' },
                    { id: 'admin-archived-partners', label: 'Archív partnerek', icon: '🗄️', desc: 'Inaktív partnerek és szerepköreik' },
                    { id: 'admin-finance-trucks', label: 'Type Truck (Pénzügyi)', icon: '🚛', desc: 'Pénzügyi kamion típusok' },
                    { id: 'admin-finance-tax-rates', label: 'TpTAX (Adókulcsok)', icon: '💰', desc: 'Pénzügyi adókulcsok' },
                    { id: 'admin-currencies', label: 'Currencies (Devizák)', icon: '💱', desc: 'Pénznemek kezelése' },
                ],
            }
        ],
    },
    {
        id: 'aldi',
        label: '<img src="AldiNord-WorldwideLogo.svg" alt="ALDI" style="height:16px; margin-right:5px; vertical-align:-3px; border-radius: 2px;"> ALDI',
        groups: [],
    },
    {
        id: 'spar',
        label: '<img src="Sparlogo.png" alt="SPAR" style="height:16px; margin-right:5px; vertical-align:-3px; border-radius: 2px;"> SPAR',
        groups: [],
    },
    {
        id: 'tesco',
        label: '<img src="TescoLogo.jpg" alt="TESCO" style="height:16px; margin-right:5px; vertical-align:-3px; border-radius: 2px;"> TESCO',
        groups: [],
    },
    {
        id: 'penny',
        label: '<img src="Penny logo.jpg" alt="PENNY" style="height:16px; margin-right:5px; vertical-align:-3px; border-radius: 2px;"> PENNY',
        groups: [
            { id: 'penny_stock', title: 'Stock', icon: '📊', moduleId: 'penny_stock', items: [] },
            { id: 'penny_belfoldi_fuvarok', title: 'Belföldi fuvarok', icon: '🚚', moduleId: 'penny_belfoldi_fuvarok', items: [] },
            { id: 'penny_komissios_utasitas', title: 'Komissiós utasítás', icon: '📋', moduleId: 'penny_komissios_utasitas', items: [] },
        ],
    }
];
