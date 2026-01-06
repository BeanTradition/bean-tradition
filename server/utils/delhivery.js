const axios = require('axios');

/**
 * Delhivery API Wrapper
 * Docs: https://delhivery.github.io/
 */
class DelhiveryService {
    constructor() {
        this.token = process.env.DELHIVERY_TOKEN;
        this.baseUrl = process.env.NODE_ENV === 'production'
            ? 'https://track.delhivery.com'
            : 'https://staging-express.delhivery.com';

        // Delhivery often uses track.delhivery.com for production APIs
        this.prodUrl = 'https://track.delhivery.com';
    }

    /**
     * Calculate Shipping Charges
     * @param {Object} params { origin_pincode, destination_pincode, weight (in grams), payment_mode (Prepaid/Cash) }
     */
    async calculateRates({ origin, destination, weight, payment_mode = 'Prepaid' }) {
        try {
            const response = await axios.get(`${this.prodUrl}/api/kinko/v1/invoice/charges/.json`, {
                params: {
                    md: 'S', // Shipping mode: Surface
                    ss: 'Delivered',
                    d_pin: destination,
                    o_pin: origin,
                    wt: weight,
                    pt: payment_mode
                },
                headers: {
                    'Authorization': `Token ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('Delhivery Rate Calc Error:', error.response?.data || error.message);
            throw new Error('Failed to calculate shipping rates');
        }
    }

    /**
     * Check Serviceability for a Pincode
     */
    async checkServiceability(pincode) {
        try {
            const response = await axios.get(`${this.prodUrl}/cmu/push/json/`, {
                params: { pincode },
                headers: {
                    'Authorization': `Token ${this.token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Delhivery Serviceability Error:', error.response?.data || error.message);
            return { deliverable: false };
        }
    }

    /**
     * Create Shipment (Manifestation)
     * @param {Object} orderData { name, address, pincode, phone, orderId, amount, weight }
     */
    async createShipment(orderData) {
        if (!this.token) {
            console.warn('Delhivery Token missing, skipping shipment creation');
            return null;
        }

        try {
            const shipmentPayload = {
                shipments: [
                    {
                        name: orderData.name,
                        add: orderData.address,
                        pin: orderData.pincode,
                        phone: orderData.phone,
                        order: orderData.orderId,
                        payment_mode: "Prepaid",
                        shipping_mode: "Surface",
                        total_amount: orderData.amount.toString(),
                        weight: orderData.weight || 500
                    }
                ],
                pickup_location: {
                    name: process.env.DELHIVERY_WAREHOUSE_NAME || "Main_Warehouse"
                }
            };

            // Delhivery CMU API often requires URL-encoded payload: format=json&data={...}
            const formData = new URLSearchParams();
            formData.append('format', 'json');
            formData.append('data', JSON.stringify(shipmentPayload));

            const response = await axios.post(`${this.baseUrl}/api/cmu/create.json`, formData.toString(), {
                headers: {
                    'Authorization': `Token ${this.token}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                }
            });

            console.log('Delhivery Shipment Creation Response:', JSON.stringify(response.data, null, 2));
            return response.data;
        } catch (error) {
            console.error('Delhivery Shipment Creation Error:', error.response?.data || error.message);
            return null;
        }
    }
}

module.exports = new DelhiveryService();
