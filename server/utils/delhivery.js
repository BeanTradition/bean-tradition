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
            const payload = {
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

            const response = await axios.post(`${this.prodUrl}/api/cmu/create.json`, payload, {
                headers: {
                    'Authorization': `Token ${this.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log('Delhivery Shipment Created:', response.data);
            return response.data;
        } catch (error) {
            console.error('Delhivery Shipment Creation Error:', error.response?.data || error.message);
            // We don't throw here to avoid failing the order flow if the external API is down
            return null;
        }
    }
}

module.exports = new DelhiveryService();
