async function mergeOrInsertDemand(trx, data) {
    const unfulfilled = await trx('cargo_demands').where('is_fulfilled', false);

    const dataProductId = data.product_id || null;
    const dataProductName = (data.product_name || '').trim();
    const dataPartnerId = data.partner_id || null;
    const dataPartnerName = (data.partner_name || '').trim();
    const dataCustomerName = (data.customer_name || '').trim();
    const dataAlbaran = (data.albaran_number || '').trim();
    const dataDest = (data.destination || '').trim();
    const dataPriceEur = parseFloat(data.price_eur) || 0;
    const dataPriceBcn = parseFloat(data.price_bcn_eur) || 0;
    const dataUnit = (data.unit || '').trim();
    const dataReloading = parseFloat(data.reloading_per_plt) || 0;
    const dataTransportBcn = parseFloat(data.transport_bcn_per_plt) || 0;
    const dataOrderNo = (data.customer_order_no || '').trim();
    
    // We treat comment and notes as equivalent if one is provided
    const dataComment = (data.comment || data.notes || '').trim();

    const match = unfulfilled.find(r => {
        const rProductId = r.product_id || null;
        const rProductName = (r.product_name || '').trim();
        const rPartnerId = r.partner_id || null;
        const rPartnerName = (r.partner_name || '').trim();
        const rCustomerName = (r.customer_name || '').trim();
        const rAlbaran = (r.albaran_number || '').trim();
        const rDest = (r.destination || '').trim();
        const rPriceEur = parseFloat(r.price_eur) || 0;
        const rPriceBcn = parseFloat(r.price_bcn_eur) || 0;
        const rUnit = (r.unit || '').trim();
        const rReloading = parseFloat(r.reloading_per_plt) || 0;
        const rTransportBcn = parseFloat(r.transport_bcn_per_plt) || 0;
        const rOrderNo = (r.customer_order_no || '').trim();
        const rComment = (r.comment || r.notes || '').trim();

        return (
            rProductId == dataProductId &&
            rProductName === dataProductName &&
            rPartnerId == dataPartnerId &&
            rPartnerName === dataPartnerName &&
            rCustomerName === dataCustomerName &&
            rAlbaran === dataAlbaran &&
            rDest === dataDest &&
            Math.abs(rPriceEur - dataPriceEur) < 0.01 &&
            Math.abs(rPriceBcn - dataPriceBcn) < 0.01 &&
            rUnit === dataUnit &&
            Math.abs(rReloading - dataReloading) < 0.01 &&
            Math.abs(rTransportBcn - dataTransportBcn) < 0.01 &&
            rOrderNo === dataOrderNo &&
            rComment === dataComment
        );
    });

    const dataEuro = parseFloat(data.euro_palets) || 0;
    const dataNormal = parseFloat(data.normal_palets) || 0;
    const dataGrossWeight = parseFloat(data.gross_weight_kg) || 0;

    if (match) {
        // Merge quantities
        const newEuro = (parseFloat(match.euro_palets) || 0) + dataEuro;
        const newNormal = (parseFloat(match.normal_palets) || 0) + dataNormal;
        const newGrossWeight = (parseFloat(match.gross_weight_kg) || 0) + dataGrossWeight;

        await trx('cargo_demands').where('id', match.id).update({
            euro_palets: newEuro,
            normal_palets: newNormal,
            gross_weight_kg: newGrossWeight,
            // optionally update source_shipment_line_id to the latest, or leave as is
            source_shipment_line_id: data.source_shipment_line_id || match.source_shipment_line_id
        });
        return match.id;
    } else {
        // Insert new
        const [newId] = await trx('cargo_demands').insert(data).returning('id');
        return typeof newId === 'object' ? newId.id : newId;
    }
}

module.exports = { mergeOrInsertDemand };
