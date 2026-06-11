export const NAV_CATEGORIES = [
    {
        id: 'iroda',
        label: 'IRODA',
        groups: [
            // Később kerülnek ide az Iroda modulok
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
            { id: 'planning', title: 'Planning', icon: '📅', moduleId: 'planning', items: [] },
            { id: 'erkezesek', title: 'Érkezések', icon: '📥', moduleId: 'erkezesek', items: [] },
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
                items: [],
            }
        ],
    },
    {
        id: 'aldi',
        label: 'ALDI',
        groups: [],
    },
    {
        id: 'spar',
        label: 'SPAR',
        groups: [],
    },
    {
        id: 'tesco',
        label: 'TESCO',
        groups: [],
    },
    {
        id: 'eurogroup',
        label: 'EUROGROUP',
        groups: [],
    }
];
