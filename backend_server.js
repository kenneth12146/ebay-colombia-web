require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Pool } = require('pg');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ============================================================
// CONEXIÓN A POSTGRESQL
// ============================================================
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'marlon_audio',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '2004'
});

const db = {
    query: (text, params) => pool.query(text, params)
};

pool.connect()
    .then(() => console.log('✅ Conectado a PostgreSQL - Base de datos:', process.env.DB_NAME || 'marlon_audio'))
    .catch(err => console.error('❌ Error conectando a PostgreSQL:', err.message));

app.get('/', (req, res) => {
    res.send('🚀 Servidor Marlon Audio funcionando correctamente');
});

// ============================================================
// FUNCIÓN PARA OBTENER FOTOS
// ============================================================
async function obtenerFotoProducto(itemId, token) {
    try {
        const response = await axios.get(`https://api.ebay.com/buy/browse/v1/item/get_item_by_legacy_id`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
                'Accept': 'application/json'
            },
            params: { legacy_item_id: itemId }
        });
        
        const imageUrl = response.data.image?.imageUrl;
        if (imageUrl) return imageUrl;
        
        const thumbnails = response.data.thumbnailImages;
        if (thumbnails && thumbnails.length > 0) return thumbnails[0].imageUrl;
        
        return null;
    } catch (error) {
        try {
            const altResponse = await axios.get(`https://api.ebay.com/buy/browse/v1/item/v1|${itemId}|0`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
                    'Accept': 'application/json'
                }
            });
            return altResponse.data.image?.imageUrl || null;
        } catch (altError) {
            return null;
        }
    }
}

// ============================================================
// FUNCIÓN PARA OBTENER ÓRDENES DE EBAY
// ============================================================
async function obtenerOrdenesEbay(days = 30, incluirFotos = true) {
    const token = process.env.EBAY_USER_TOKEN;

    if (!token) {
        throw new Error('EBAY_USER_TOKEN no está definido en las variables de entorno');
    }

    // La API Trading de eBay solo acepta NumberOfDays hasta 30.
    // Para rangos mayores usamos CreateTimeFrom/CreateTimeTo.
    const usarRangoFechas = days > 30;
    
    let todasLasOrdenes = [];
    let pagina = 1;
    let totalPaginas = 1;
    let totalEntries = 0;
    
    do {
        let filtroFecha = '';
        if (usarRangoFechas) {
            const hasta = new Date();
            const desde = new Date();
            desde.setDate(desde.getDate() - days);
            filtroFecha = `
            <CreateTimeFrom>${desde.toISOString()}</CreateTimeFrom>
            <CreateTimeTo>${hasta.toISOString()}</CreateTimeTo>`;
        } else {
            filtroFecha = `<NumberOfDays>${days}</NumberOfDays>`;
        }

        const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
        <GetOrdersRequest xmlns="urn:ebay:apis:eBLBaseComponents">
            <RequesterCredentials>
                <eBayAuthToken>${token}</eBayAuthToken>
            </RequesterCredentials>
            <OrderRole>Buyer</OrderRole>
            <OrderStatus>Completed</OrderStatus>
            ${filtroFecha}
            <Pagination>
                <EntriesPerPage>100</EntriesPerPage>
                <PageNumber>${pagina}</PageNumber>
            </Pagination>
        </GetOrdersRequest>`;
        
        const response = await axios.post('https://api.ebay.com/ws/api.dll', xmlBody, {
            headers: {
                'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
                'X-EBAY-API-CALL-NAME': 'GetOrders',
                'X-EBAY-API-SITEID': '0',
                'Content-Type': 'text/xml'
            }
        });
        
        const xmlData = response.data;

        // Detectar errores de eBay en la respuesta XML
        const ackMatch = xmlData.match(/<Ack>(.*?)<\/Ack>/);
        const ack = ackMatch ? ackMatch[1] : 'Unknown';
        if (ack === 'Failure') {
            const errorMsg = (xmlData.match(/<LongMessage>(.*?)<\/LongMessage>/) || [])[1] || 'Error desconocido de eBay';
            const errorCode = (xmlData.match(/<ErrorCode>(.*?)<\/ErrorCode>/) || [])[1] || '';
            throw new Error(`eBay API Error [${errorCode}]: ${errorMsg}`);
        }
        
        if (pagina === 1) {
            const totalPagesMatch = xmlData.match(/<TotalNumberOfPages>(\d+)<\/TotalNumberOfPages>/);
            if (totalPagesMatch) totalPaginas = parseInt(totalPagesMatch[1]);
            const totalEntriesMatch = xmlData.match(/<TotalNumberOfEntries>(\d+)<\/TotalNumberOfEntries>/);
            if (totalEntriesMatch) totalEntries = parseInt(totalEntriesMatch[1]);
            console.log(`   📊 eBay reporta: ${totalEntries} órdenes totales, ${totalPaginas} páginas (días: ${days}, modo: ${usarRangoFechas ? 'rango fechas' : 'NumberOfDays'})`);
        }
        
        const orderMatches = xmlData.match(/<Order>[\s\S]*?<\/Order>/g) || [];
        
        for (const orderXml of orderMatches) {
            const orderId = (orderXml.match(/<OrderID>(.*?)<\/OrderID>/) || [])[1] || '';
            const itemId = (orderXml.match(/<ItemID>(.*?)<\/ItemID>/) || [])[1] || '';
            const title = (orderXml.match(/<Title>(.*?)<\/Title>/) || [])[1] || 'Sin título';
            const quantity = parseInt((orderXml.match(/<QuantityPurchased>(.*?)<\/QuantityPurchased>/) || [])[1] || '1');
            const transactionPrice = parseFloat((orderXml.match(/<TransactionPrice currencyID="USD">(.*?)<\/TransactionPrice>/) || [])[1] || '0');
            const shippingCost = parseFloat((orderXml.match(/<ShippingServiceCost currencyID="USD">(.*?)<\/ShippingServiceCost>/) || [])[1] || '0');
            const total = parseFloat((orderXml.match(/<Total currencyID="USD">(.*?)<\/Total>/) || [])[1] || '0');
            const trackingNumber = (orderXml.match(/<ShipmentTrackingNumber>(.*?)<\/ShipmentTrackingNumber>/) || [])[1] || null;
            const carrier = (orderXml.match(/<ShippingCarrierUsed>(.*?)<\/ShippingCarrierUsed>/) || [])[1] || null;
            const createdTime = (orderXml.match(/<CreatedTime>(.*?)<\/CreatedTime>/) || [])[1] || '';
            const shippedTime = (orderXml.match(/<ShippedTime>(.*?)<\/ShippedTime>/) || [])[1] || null;
            const deliveredTime = (orderXml.match(/<ActualDeliveryTime>(.*?)<\/ActualDeliveryTime>/) || [])[1] || null;
            const sellerUserId = (orderXml.match(/<SellerUserID>(.*?)<\/SellerUserID>/) || [])[1] || '';
            
            let estado = 'pagado';
            let estadoDesc = '⏳ Pagado, esperando envío';
            if (deliveredTime) { estado = 'entregado'; estadoDesc = '✅ Entregado en Miami'; }
            else if (shippedTime) { estado = 'en-camino'; estadoDesc = '📦 En camino a Miami'; }
            
            let trackingUrl = null;
            if (trackingNumber && carrier) {
                if (carrier.includes('USPS')) trackingUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
                else if (carrier.includes('FedEx')) trackingUrl = `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
                else if (carrier.includes('UPS')) trackingUrl = `https://www.ups.com/track?tracknum=${trackingNumber}`;
            }
            
            todasLasOrdenes.push({
                orderId, itemId, title, quantity, seller: sellerUserId,
                price_ebay: transactionPrice, shipping_ebay: shippingCost, total_paid: total,
                tracking_number: trackingNumber, carrier, tiene_tracking: !!trackingNumber,
                estado_envio: estado, estado_descripcion: estadoDesc,
                fue_enviado: !!shippedTime, fue_entregado: !!deliveredTime,
                purchase_date: createdTime, shipped_date: shippedTime, delivered_date: deliveredTime,
                ebay_url: itemId ? `https://www.ebay.com/itm/${itemId}` : null,
                tracking_url: trackingUrl,
                photo_url: null
            });
        }
        
        pagina++;
    } while (pagina <= totalPaginas);
    
    todasLasOrdenes.sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date));
    
    if (incluirFotos && todasLasOrdenes.length > 0) {
        for (let i = 0; i < todasLasOrdenes.length; i++) {
            const orden = todasLasOrdenes[i];
            if (orden.itemId) {
                orden.photo_url = await obtenerFotoProducto(orden.itemId, token);
                await new Promise(r => setTimeout(r, 200));
            }
        }
    }
    
    return { totalEntries, ordenes: todasLasOrdenes };
}

// ============================================================
// ENDPOINTS ORIGINALES DE EBAY
// ============================================================
app.get('/api/ebay/mis-compras-trading', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const { ordenes } = await obtenerOrdenesEbay(30, false);
        const masRecientes = ordenes.slice(0, limit);
        res.json({ success: true, total_ordenes: ordenes.length, ordenes: masRecientes.map(o => ({
            orderId: o.orderId, itemId: o.itemId, title: o.title,
            total: o.total_paid, trackingNumber: o.tracking_number,
            carrier: o.carrier, createdTime: o.purchase_date
        }))});
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/ebay/ordenes-completas', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const incluirFotos = req.query.fotos !== 'false';
        
        console.log(`🔍 Obteniendo órdenes (versión mejorada)...`);
        
        const { totalEntries, ordenes } = await obtenerOrdenesEbay(30, incluirFotos);
        const ordenesSeleccionadas = ordenes.slice(0, limit);
        
        const resultado = ordenesSeleccionadas.map(o => ({
            ...o,
            purchase_date_formatted: o.purchase_date ? new Date(o.purchase_date).toLocaleDateString('es-CO') : null,
            unit_price: o.quantity > 1 ? (o.price_ebay / o.quantity).toFixed(2) : o.price_ebay,
            unit_total: o.quantity > 1 ? (o.total_paid / o.quantity).toFixed(2) : o.total_paid
        }));
        
        res.json({
            success: true,
            total_ordenes: totalEntries,
            mostrando: resultado.length,
            incluye_fotos: incluirFotos,
            ordenes: resultado,
            resumen: {
                total_invertido: resultado.reduce((s, o) => s + o.total_paid, 0).toFixed(2),
                total_productos: resultado.reduce((s, o) => s + o.quantity, 0)
            }
        });
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// SINCRONIZACIÓN AUTOMÁTICA (CADA 2 MINUTOS)
// ============================================================
let sincronizando = false;

async function sincronizarEbayAutomatico() {
    if (sincronizando) return;
    sincronizando = true;
    
    try {
        const token = process.env.EBAY_USER_TOKEN;
        const days = 7;
        
        let nuevas = 0;
        let actualizadas = 0;
        let pagina = 1;
        let totalPaginas = 1;
        
        do {
            const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
            <GetOrdersRequest xmlns="urn:ebay:apis:eBLBaseComponents">
                <RequesterCredentials>
                    <eBayAuthToken>${token}</eBayAuthToken>
                </RequesterCredentials>
                <OrderRole>Buyer</OrderRole>
                <OrderStatus>Completed</OrderStatus>
                <NumberOfDays>${days}</NumberOfDays>
                <Pagination>
                    <EntriesPerPage>100</EntriesPerPage>
                    <PageNumber>${pagina}</PageNumber>
                </Pagination>
            </GetOrdersRequest>`;
            
            const response = await axios.post('https://api.ebay.com/ws/api.dll', xmlBody, {
                headers: {
                    'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
                    'X-EBAY-API-CALL-NAME': 'GetOrders',
                    'X-EBAY-API-SITEID': '0',
                    'Content-Type': 'text/xml'
                }
            });
            
            const xmlData = response.data;
            
            if (pagina === 1) {
                const totalPagesMatch = xmlData.match(/<TotalNumberOfPages>(\d+)<\/TotalNumberOfPages>/);
                if (totalPagesMatch) totalPaginas = parseInt(totalPagesMatch[1]);
            }
            
            const orderMatches = xmlData.match(/<Order>[\s\S]*?<\/Order>/g) || [];
            
            for (const orderXml of orderMatches) {
                const orderId = (orderXml.match(/<OrderID>(.*?)<\/OrderID>/) || [])[1] || '';
                const itemId = (orderXml.match(/<ItemID>(.*?)<\/ItemID>/) || [])[1] || '';
                const title = (orderXml.match(/<Title>(.*?)<\/Title>/) || [])[1] || 'Sin título';
                const quantity = parseInt((orderXml.match(/<QuantityPurchased>(.*?)<\/QuantityPurchased>/) || [])[1] || '1');
                const transactionPrice = parseFloat((orderXml.match(/<TransactionPrice currencyID="USD">(.*?)<\/TransactionPrice>/) || [])[1] || '0');
                const shippingCost = parseFloat((orderXml.match(/<ShippingServiceCost currencyID="USD">(.*?)<\/ShippingServiceCost>/) || [])[1] || '0');
                const total = parseFloat((orderXml.match(/<Total currencyID="USD">(.*?)<\/Total>/) || [])[1] || '0');
                const trackingNumber = (orderXml.match(/<ShipmentTrackingNumber>(.*?)<\/ShipmentTrackingNumber>/) || [])[1] || null;
                const carrier = (orderXml.match(/<ShippingCarrierUsed>(.*?)<\/ShippingCarrierUsed>/) || [])[1] || null;
                const createdTime = (orderXml.match(/<CreatedTime>(.*?)<\/CreatedTime>/) || [])[1] || '';
                const shippedTime = (orderXml.match(/<ShippedTime>(.*?)<\/ShippedTime>/) || [])[1] || null;
                const deliveredTime = (orderXml.match(/<ActualDeliveryTime>(.*?)<\/ActualDeliveryTime>/) || [])[1] || null;
                const sellerUserId = (orderXml.match(/<SellerUserID>(.*?)<\/SellerUserID>/) || [])[1] || '';
                
                let estado = 'pagado';
                let estadoDesc = '⏳ Pagado, esperando envío';
                if (deliveredTime) { estado = 'entregado'; estadoDesc = '✅ Entregado en Miami'; }
                else if (shippedTime) { estado = 'en-camino'; estadoDesc = '📦 En camino a Miami'; }
                
                let trackingUrl = null;
                if (trackingNumber && carrier) {
                    if (carrier.includes('USPS')) trackingUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
                    else if (carrier.includes('FedEx')) trackingUrl = `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
                    else if (carrier.includes('UPS')) trackingUrl = `https://www.ups.com/track?tracknum=${trackingNumber}`;
                }
                
                const existe = await db.query(
                    'SELECT tracking_number, carrier, estado_envio, delivered_date FROM products WHERE ebay_order_id = $1',
                    [orderId]
                );
                
                if (existe.rows.length === 0) {
                    let photo_url = null;
                    try {
                        photo_url = await obtenerFotoProducto(itemId, token);
                    } catch (e) {}
                    
                    await db.query(
                        `INSERT INTO products 
                         (ebay_order_id, item_id, title, photo_url, seller, ebay_url,
                          quantity, price_ebay, shipping_ebay, total_paid,
                          tracking_number, carrier, tracking_url,
                          estado_envio, estado_descripcion, fue_enviado, fue_entregado,
                          purchase_date, shipped_date, delivered_date)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
                        [orderId, itemId, title, photo_url, sellerUserId, `https://www.ebay.com/itm/${itemId}`,
                         quantity, transactionPrice, shippingCost, total,
                         trackingNumber, carrier, trackingUrl,
                         estado, estadoDesc, !!shippedTime, !!deliveredTime,
                         createdTime, shippedTime, deliveredTime]
                    );
                    
                    await db.query(
                        `INSERT INTO ebay_orders (ebay_order_id, purchase_date, total_amount, status)
                         VALUES ($1, $2, $3, $4)
                         ON CONFLICT (ebay_order_id) DO NOTHING`,
                        [orderId, createdTime, total, 'Completed']
                    );
                    
                    nuevas++;
                    console.log(`   🆕 NUEVA: ${orderId} - ${title.substring(0, 40)}...`);
                    
                } else {
                    const actual = existe.rows[0];
                    const trackingCambio = actual.tracking_number !== trackingNumber;
                    const estadoCambio = actual.estado_envio !== estado;
                    const entregadoCambio = (actual.delivered_date === null && deliveredTime !== null);
                    
                    if (trackingCambio || estadoCambio || entregadoCambio) {
                        await db.query(
                            `UPDATE products 
                             SET tracking_number = COALESCE($1, tracking_number),
                                 carrier = COALESCE($2, carrier),
                                 tracking_url = COALESCE($3, tracking_url),
                                 estado_envio = CASE
                                     WHEN estado_envio IN ('en-camino-colombia', 'en-colombia', 'recibido', 'vendido')
                                     THEN estado_envio
                                     ELSE $4
                                 END,
                                 estado_descripcion = CASE
                                     WHEN estado_envio IN ('en-camino-colombia', 'en-colombia', 'recibido', 'vendido')
                                     THEN estado_descripcion
                                     ELSE $5
                                 END,
                                 fue_enviado = $6,
                                 fue_entregado = $7,
                                 shipped_date = COALESCE($8, shipped_date),
                                 delivered_date = COALESCE($9, delivered_date),
                                 updated_at = NOW()
                             WHERE ebay_order_id = $10`,
                            [trackingNumber, carrier, trackingUrl, estado, estadoDesc, !!shippedTime, !!deliveredTime, shippedTime, deliveredTime, orderId]
                        );
                        actualizadas++;
                        console.log(`   🔄 ACTUALIZADA: ${orderId} - tracking: ${trackingNumber || 'pendiente'}, estado: ${estado}`);
                    }
                }
            }
            
            pagina++;
        } while (pagina <= totalPaginas);
        
        if (nuevas > 0 || actualizadas > 0) {
            console.log(`✅ [AUTO] Sincronización: ${nuevas} nuevas, ${actualizadas} actualizadas`);
        }
        
    } catch (error) {
        console.error('❌ [AUTO] Error:', error.message);
    } finally {
        sincronizando = false;
    }
}

cron.schedule('*/2 * * * *', sincronizarEbayAutomatico);
console.log('⏰ Sincronización automática: Cada 2 minutos');

// ============================================================
// ENDPOINT DE SINCRONIZACIÓN MANUAL
// ============================================================
app.post('/api/sync/ebay/manual', async (req, res) => {
    try {
        // Acepta días desde el body, con máximo de 60 para evitar rechazos de eBay
        const days = Math.min(parseInt(req.body?.days) || 30, 60);
        const incluirFotos = req.body?.fotos !== false;

        console.log(`\n👆 [MANUAL] Iniciando sincronización manual... (días: ${days}, fotos: ${incluirFotos})`);
        
        const { totalEntries, ordenes } = await obtenerOrdenesEbay(days, incluirFotos);
        
        let insertadas = 0;
        let actualizadas = 0;
        
        for (const orden of ordenes) {
            const existe = await db.query(
                'SELECT ebay_order_id FROM products WHERE ebay_order_id = $1',
                [orden.orderId]
            );
            
            if (existe.rows.length === 0) {
                await db.query(
                    `INSERT INTO products 
                     (ebay_order_id, item_id, title, photo_url, seller, ebay_url,
                      quantity, price_ebay, shipping_ebay, total_paid,
                      tracking_number, carrier, tracking_url,
                      estado_envio, estado_descripcion, fue_enviado, fue_entregado,
                      purchase_date, shipped_date, delivered_date)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
                    [orden.orderId, orden.itemId, orden.title, orden.photo_url, orden.seller, orden.ebay_url,
                     orden.quantity, orden.price_ebay, orden.shipping_ebay, orden.total_paid,
                     orden.tracking_number, orden.carrier, orden.tracking_url,
                     orden.estado_envio, orden.estado_descripcion, orden.fue_enviado, orden.fue_entregado,
                     orden.purchase_date, orden.shipped_date, orden.delivered_date]
                );
                
                await db.query(
                    `INSERT INTO ebay_orders (ebay_order_id, purchase_date, total_amount, status)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (ebay_order_id) DO NOTHING`,
                    [orden.orderId, orden.purchase_date, orden.total_paid, 'Completed']
                );
                
                insertadas++;
            } else {
                await db.query(
                    `UPDATE products 
                     SET tracking_number = COALESCE($1, tracking_number),
                         carrier = COALESCE($2, carrier),
                         estado_envio = CASE
                             WHEN estado_envio IN ('en-camino-colombia', 'en-colombia', 'recibido', 'vendido')
                             THEN estado_envio
                             ELSE $3
                         END,
                         estado_descripcion = CASE
                             WHEN estado_envio IN ('en-camino-colombia', 'en-colombia', 'recibido', 'vendido')
                             THEN estado_descripcion
                             ELSE $4
                         END,
                         shipped_date = COALESCE($5, shipped_date),
                         delivered_date = COALESCE($6, delivered_date),
                         updated_at = NOW()
                     WHERE ebay_order_id = $7`,
                    [orden.tracking_number, orden.carrier, orden.estado_envio, orden.estado_descripcion,
                     orden.shipped_date, orden.delivered_date, orden.orderId]
                );
                actualizadas++;
            }
        }
        
        res.json({
            success: true,
            message: '✅ Sincronización manual completada',
            dias_consultados: days,
            total_ebay: totalEntries,
            insertadas,
            actualizadas,
            sin_cambios: ordenes.length - insertadas - actualizadas,
            nota: totalEntries === 0
                ? '⚠️ eBay devolvió 0 órdenes. Verifica que el token EBAY_USER_TOKEN esté vigente.'
                : null
        });
        
    } catch (error) {
        console.error('❌ [MANUAL] Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// MÓDULO CASILLERO (LOGYBOX)
// ============================================================

// POST /api/casillero/match - Buscar producto por guía Logybox
app.post('/api/casillero/match', async (req, res) => {
    try {
        const { guia_logybox } = req.body;
        
        if (!guia_logybox) {
            return res.status(400).json({ success: false, error: 'Guía Logybox requerida' });
        }
        
        console.log(`\n🔍 [CASILLERO] Buscando guía: ${guia_logybox}`);
        
        const result = await db.query(
            `SELECT id, ebay_order_id, title, tracking_number, carrier, total_paid, photo_url, estado_envio
             FROM products WHERE tracking_number IS NOT NULL`
        );
        
        let productoEncontrado = null;
        
        for (const producto of result.rows) {
            // Lógica según carrier
            if (producto.carrier === 'USPS') {
                // USPS: tracking contenido dentro de la guía Logybox
                if (guia_logybox.includes(producto.tracking_number)) {
                    productoEncontrado = producto;
                    console.log(`   ✅ Encontrado (USPS): ${producto.title}`);
                    break;
                }
            } else if (producto.carrier === 'FedEx') {
                // FedEx: la guía Logybox TERMINA con el tracking original (tiene prefijo)
                if (guia_logybox.endsWith(producto.tracking_number)) {
                    productoEncontrado = producto;
                    console.log(`   ✅ Encontrado (FedEx): ${producto.title}`);
                    break;
                }
            } else {
                // UPS, DHL: coincidencia exacta
                if (guia_logybox === producto.tracking_number) {
                    productoEncontrado = producto;
                    console.log(`   ✅ Encontrado (${producto.carrier}): ${producto.title}`);
                    break;
                }
            }
        }
        
        if (!productoEncontrado) {
            console.log(`   ❌ No se encontró coincidencia`);
            return res.status(404).json({ success: false, mensaje: '❌ No se encontró ningún producto con esa guía' });
        }
        
        res.json({ success: true, producto: productoEncontrado, mensaje: '✅ Producto encontrado. Agrega el costo de envío a Colombia.' });
        
    } catch (error) {
        console.error('❌ [CASILLERO] Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/casillero/confirm - Confirmar y actualizar
app.put('/api/casillero/confirm', async (req, res) => {
    try {
        const { producto_id, costo_logybox, guia_logybox } = req.body;
        
        if (!producto_id || !costo_logybox) {
            return res.status(400).json({ success: false, error: 'Faltan datos requeridos (producto_id, costo_logybox)' });
        }
        
        console.log(`\n📦 [CASILLERO] Confirmando envío para producto ${producto_id} - Costo: $${costo_logybox}`);
        
        const result = await db.query(
            `UPDATE products 
             SET guia_logybox = COALESCE($1, guia_logybox),
                 costo_logybox = $2,
                 fecha_llegada_logybox = NOW(),
                 estado_envio = 'en-camino-colombia',
                 estado_descripcion = '📦 En camino a Colombia (Logybox)',
                 updated_at = NOW()
             WHERE id = $3
             RETURNING *, (total_paid + $2) as costo_total_actualizado`,
            [guia_logybox, costo_logybox, producto_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }
        
        const guia = guia_logybox || `${result.rows[0].tracking_number}_LOGYBOX`;
        await db.query(
            `INSERT INTO logybox_shipments (guia_logybox, product_id, costo_envio, fecha_notificacion, fecha_procesado)
             VALUES ($1, $2, $3, NOW(), NOW())
             ON CONFLICT (guia_logybox) DO UPDATE
             SET costo_envio = EXCLUDED.costo_envio, fecha_procesado = NOW()`,
            [guia, producto_id, costo_logybox]
        );
        
        console.log(`   ✅ Producto actualizado: ${result.rows[0].title}`);
        console.log(`   💰 Costo total actualizado: $${result.rows[0].costo_total_actualizado}`);
        
        res.json({ success: true, mensaje: '✅ Producto actualizado. En camino a Colombia.', producto: result.rows[0] });
        
    } catch (error) {
        console.error('❌ [CASILLERO] Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/casillero/en-camino - Ver productos en camino a Colombia
app.get('/api/casillero/en-camino', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, ebay_order_id, title, photo_url, total_paid, costo_logybox, 
                    costo_total, tracking_number, guia_logybox, fecha_llegada_logybox, estado_descripcion
             FROM products WHERE estado_envio = 'en-camino-colombia'
             ORDER BY fecha_llegada_logybox DESC`
        );
        res.json({ success: true, total: result.rows.length, productos: result.rows });
    } catch (error) {
        console.error('❌ [CASILLERO] Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/casillero/buscar-lbx - Buscar producto por ID Logybox (LBX)
app.get('/api/casillero/buscar-lbx', async (req, res) => {
    try {
        const { lbx } = req.query;

        if (!lbx) {
            return res.status(400).json({ success: false, error: 'Parámetro lbx requerido' });
        }

        console.log(`\n🔍 [CASILLERO] Buscando por LBX: ${lbx}`);

        const result = await db.query(
            `SELECT id, ebay_order_id, title, photo_url, total_paid, costo_logybox,
                    costo_total, tracking_number, carrier, guia_logybox,
                    estado_envio, estado_descripcion, fecha_llegada_logybox
             FROM products
             WHERE UPPER(guia_logybox) = UPPER($1)
             LIMIT 1`,
            [lbx.trim()]
        );

        if (result.rows.length === 0) {
            console.log(`   ❌ No se encontró producto con LBX: ${lbx}`);
            return res.status(404).json({ success: false, mensaje: `❌ No se encontró ningún paquete con el ID ${lbx}` });
        }

        console.log(`   ✅ Encontrado: ${result.rows[0].title}`);
        res.json({ success: true, producto: result.rows[0] });

    } catch (error) {
        console.error('❌ [CASILLERO] Error buscar-lbx:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PATCH /api/casillero/actualizar-costo - Editar costo de envío Logybox
app.patch('/api/casillero/actualizar-costo', async (req, res) => {
    try {
        const { producto_id, costo_logybox } = req.body;

        if (!producto_id || costo_logybox === undefined) {
            return res.status(400).json({ success: false, error: 'Faltan datos: producto_id y costo_logybox requeridos' });
        }

        console.log(`\n✏️  [CASILLERO] Actualizando costo producto ${producto_id} -> $${costo_logybox}`);

        const result = await db.query(
            `UPDATE products
             SET costo_logybox = $1,
                 updated_at = NOW()
             WHERE id = $2
             RETURNING id, costo_logybox, total_paid, (total_paid + $1) as costo_total`,
            [costo_logybox, producto_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }

        console.log(`   ✅ Costo actualizado: $${costo_logybox}`);
        res.json({
            success: true,
            mensaje: '✅ Costo de envío actualizado',
            costo_total: result.rows[0].costo_total
        });

    } catch (error) {
        console.error('❌ [CASILLERO] Error actualizar-costo:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// ENDPOINT PARA VER PRODUCTOS GUARDADOS
// ============================================================
app.get('/api/products', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const result = await db.query(
            `SELECT * FROM products ORDER BY purchase_date DESC LIMIT $1`,
            [limit]
        );
        res.json({ success: true, total: result.rows.length, products: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// MÓDULO INVENTARIO COLOMBIA (carga segura)
// ============================================================
try {
    const inventarioRouter = require('./inventario');
    app.use('/api/inventario', inventarioRouter);
    console.log('✅ Módulo inventario cargado correctamente');
} catch (err) {
    console.warn('⚠️  Módulo inventario no disponible:', err.message);
    app.use('/api/inventario', (req, res) => {
        res.status(503).json({ success: false, error: 'Módulo inventario no disponible: ' + err.message });
    });
}

// ============================================================
// MÓDULO DASHBOARD (carga segura)
// ============================================================
try {
    const dashboardRouter = require('./dashboard');
    app.use('/api/dashboard', dashboardRouter);
    console.log('✅ Módulo dashboard cargado correctamente');
} catch (err) {
    console.warn('⚠️  Módulo dashboard no disponible:', err.message);
    app.use('/api/dashboard', (req, res) => {
        res.status(503).json({ success: false, error: 'Módulo dashboard no disponible: ' + err.message });
    });
}

// ============================================================
// INICIAR SERVIDOR
// ============================================================
app.listen(PORT, () => {
    console.log(`\n✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log('');
    console.log('📋 ENDPOINTS DISPONIBLES:');
    console.log(`   ⭐ GET  /api/ebay/ordenes-completas?limit=5`);
    console.log(`   📦 GET  /api/products`);
    console.log(`   🔄 POST /api/sync/ebay/manual  -> Sincronización manual`);
    console.log(`   📬 POST /api/casillero/match    -> Buscar guía Logybox`);
    console.log(`   📦 PUT  /api/casillero/confirm  -> Confirmar envío Logybox`);
    console.log(`   📜 GET  /api/casillero/historial -> Historial de envíos Logybox`);
    console.log(`   � GET  /api/casillero/en-camino -> Productos en camino a Colombia`);
    console.log(`   🏠 POST /api/inventario/recibir    -> Registrar llegada a Colombia`);
    console.log(`   💰 PUT  /api/inventario/precios    -> Definir precios de venta`);
    console.log(`   📦 GET  /api/inventario/disponible -> Ver inventario disponible`);
    console.log(`   🛒 PUT  /api/inventario/vender     -> Registrar venta`);
    console.log(`   📊 GET  /api/inventario/estadisticas -> Dashboard inventario`);
    console.log(`   📈 GET  /api/dashboard/resumen    -> Resumen general del negocio`);
    console.log(`   📅 GET  /api/dashboard/mensual    -> Reporte por mes`);
    console.log(`   📉 GET  /api/dashboard/comparativo -> Comparativo entre meses`);
    console.log(`   🏆 GET  /api/dashboard/productos-rentables -> Top productos`);
    console.log(`   ⚠️  GET  /api/dashboard/alertas    -> Alertas del sistema`);
    console.log('');
    console.log('⏰ Sincronización automática: Cada 2 minutos (últimos 7 días)');
});