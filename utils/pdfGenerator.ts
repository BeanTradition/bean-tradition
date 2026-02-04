import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, User, CartItem } from '../types';

export const generateInvoice = (order: any, user: any | null) => {
    try {
        const doc = new jsPDF() as any;
        const brandName = "Bean Tradition";
        const brandSlogan = "Delivering Coffee & Happiness";
        const gstNo = "36FAEPR9507L1Z1";
        const fssaiNo = "23625029000985";
        const companyAddress = [
            "No. 123, Coffee Estate Row,",
            "Near Hills View Park, Chikmagalur,",
            "Karnataka - 577101",
            "India"
        ];

        // Header - Left Side (Brand Branding)
        doc.setFontSize(22);
        doc.setTextColor(44, 24, 16); // coffee-900
        doc.setFont("helvetica", "bold");
        doc.text(brandName, 20, 30);

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(60, 60, 60);
        doc.text(brandSlogan, 20, 36);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        let addressY = 42;
        companyAddress.forEach(line => {
            doc.text(line, 20, addressY);
            addressY += 4;
        });
        doc.text(`GSTIN: ${gstNo}`, 20, addressY);
        doc.text(`FSSAI: ${fssaiNo}`, 20, addressY + 4);

        // Right Side Header
        doc.setFontSize(20);
        doc.setTextColor(44, 24, 16);
        doc.setFont("helvetica", "bold");
        doc.text("PROFORMA", 140, 30, { align: 'right' });
        doc.text("INVOICE", 140, 38, { align: 'right' });
        doc.setFontSize(9);
        doc.text(`Sales Order# ${order.order_number || order.id || order._id}`, 140, 45, { align: 'right' });

        // Horizontal Line
        doc.setDrawColor(210, 180, 140);
        doc.line(20, 58, 190, 58);

        // Addresses Section
        const customerInfo = order.customer || order.shippingAddress || {};

        // Billing
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Billing Address", 20, 75);
        doc.setFont("helvetica", "normal");
        doc.text(customerInfo.name || "Customer", 20, 80);
        doc.text(customerInfo.address || "", 20, 84, { maxWidth: 60 });
        doc.text(`${customerInfo.city || ""}, ${customerInfo.pincode || ""}`, 20, 94);
        doc.text("India", 20, 98);
        doc.text(customerInfo.phone || "", 20, 102);

        // Shipping
        doc.setFont("helvetica", "bold");
        doc.text("Shipping / Delivery Address", 20, 115);
        doc.setFont("helvetica", "normal");
        doc.text(customerInfo.name || "Customer", 20, 120);
        doc.text(customerInfo.address || "", 20, 124, { maxWidth: 60 });
        doc.text(`${customerInfo.city || ""}, ${customerInfo.pincode || ""}`, 20, 134);
        doc.text("India", 20, 138);
        doc.text(customerInfo.phone || "", 20, 142);

        // Order Info Right
        doc.setFont("helvetica", "normal");
        doc.text("Order Date : ", 140, 125, { align: 'right' });
        doc.text(order.date || new Date(order.created_at).toLocaleDateString('en-IN'), 180, 125, { align: 'right' });
        doc.text("Ref# : ", 140, 132, { align: 'right' });
        doc.text(`${(order.id || order._id).substring(0, 8)}/Digital`, 180, 132, { align: 'right' });

        doc.setFont("helvetica", "bold");
        doc.text("Place Of Supply: ", 20, 155);
        doc.setFont("helvetica", "normal");
        doc.text(`${customerInfo.city || "Karnataka"} (29)`, 50, 155);

        // Table
        const tableColumn = ["#", "Item & Description", "HSN/SAC", "Qty", "Rate", "Amount"];
        const tableRows: any[] = [];

        let subTotal = 0;
        let totalCGST = 0;
        let totalSGST = 0;

        const items = order.items || order.orderItems || [];
        items.forEach((item: any, index: number) => {
            const price = item.price || (item.selectedVariant ? item.selectedVariant.price : 0);
            const category = item.category || "";

            let hsn = "09012190";
            let gstRate = 0.05;
            if (category.toLowerCase().includes("instant")) {
                hsn = "2101";
                gstRate = 0.18;
            }

            const taxableRate = price / (1 + gstRate);
            const amount = taxableRate * item.quantity;

            subTotal += amount;
            totalCGST += (amount * (gstRate / 2));
            totalSGST += (amount * (gstRate / 2));

            const profile = (item.roast || item.selectedRoast || item.intensity || item.selectedIntensity);
            const desc = `${item.name}\n${profile ? `${profile} Roast` : ''}`;

            tableRows.push([
                index + 1,
                desc,
                hsn,
                `${item.quantity} KGS`,
                taxableRate.toFixed(2),
                amount.toFixed(2)
            ]);
        });

        // Add shipping if any
        const shipping = order.shippingPrice || 0;
        if (shipping > 0) {
            const shipTaxRate = 0.05; // Standard 5% for shipping/transport
            const shipTaxable = shipping / (1 + shipTaxRate);
            subTotal += shipTaxable;
            totalCGST += (shipTaxable * (shipTaxRate / 2));
            totalSGST += (shipTaxable * (shipTaxRate / 2));

            tableRows.push([
                items.length + 1,
                "Weight Handling and Shipping Fee",
                "996811",
                "1.00 NOS",
                shipTaxable.toFixed(2),
                shipTaxable.toFixed(2)
            ]);
        }

        autoTable(doc, {
            startY: 165,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontSize: 8 },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 70 }, // Reduced slightly to fit 170mm total
                2: { cellWidth: 20 },
                3: { cellWidth: 20 },
                4: { cellWidth: 25 },
                5: { cellWidth: 25 }
            },
            margin: { left: 20, right: 20 }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;

        // Summary Section
        const labelX = 110; // Move labels further left to prevent any overlap
        const valueX = 190; // Strictly right-aligned to margin
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");

        doc.text("Sub Total:", labelX, finalY);
        doc.text(subTotal.toFixed(2), valueX, finalY, { align: 'right' });

        doc.text(`CGST ( ${(totalCGST > 0 ? (totalCGST / subTotal * 100).toFixed(1) : '2.5')}% ):`, labelX, finalY + 6);
        doc.text(totalCGST.toFixed(2), valueX, finalY + 6, { align: 'right' });

        doc.text(`SGST ( ${(totalSGST > 0 ? (totalSGST / subTotal * 100).toFixed(1) : '2.5')}% ):`, labelX, finalY + 12);
        doc.text(totalSGST.toFixed(2), valueX, finalY + 12, { align: 'right' });

        const total = subTotal + totalCGST + totalSGST;
        const rounding = Math.round(total) - total;
        doc.text("Rounding Amount:", labelX, finalY + 18);
        doc.text(rounding.toFixed(2), valueX, finalY + 18, { align: 'right' });

        // Highlight box for Total
        doc.setFillColor(245, 245, 245);
        doc.rect(labelX - 2, finalY + 22, 84, 10, 'F'); // Wider highlight box
        doc.setFont("helvetica", "bold");
        doc.text("Total Payable Amount:", labelX, finalY + 28);
        doc.text(`INR ${Math.round(total).toFixed(2)}`, valueX, finalY + 28, { align: 'right' });

        // Terms & Conditions
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("Terms & Conditions", 20, finalY + 45);
        doc.setFont("helvetica", "normal");
        const terms = [
            "MSME Registration Notice:",
            "This company is registered under the Micro, Small, and Medium enterprises (MSME) Act, 2006. Our MSME registration number is UDYAM-BT-26-0001.",
            "As per the MSME Act, 2006, payments for invoices are to be made within 45 days of receipt. Failure to comply will entitle us to claim interest on the overdue amount at the rate prescribed under the MSME Act.",
            "Product will be dispatched within 4 Days from date of Order. 100% Advance Payment along with Confirmed Purchase Order.",
            "",
            "Bank Details : IMPS/NEFT/RTGS",
            "Bean Tradition Coffee Pvt Ltd",
            "A/C: 073905013701",
            "BANK : ICICI BANK",
            "IFSC : ICIC0000739"
        ];
        let termsY = finalY + 50;
        terms.forEach(line => {
            doc.text(line, 20, termsY, { maxWidth: 100 });
            termsY += 4;
        });

        // Signature
        doc.setFont("helvetica", "bold");
        doc.text("Authorized Signature", 140, finalY + 85);
        doc.line(130, finalY + 82, 180, finalY + 82);

        doc.save(`Invoice_${order.order_number || order.id || order._id}.pdf`);
    } catch (err: any) {
        console.error("Invoice Error:", err);
        alert(`Error: ${err.message || 'Check console for details'}`);
    }
};

export const generateCustomerReport = (orders: any[], customer: any) => {
    try {
        const doc = new jsPDF() as any;

        doc.setFontSize(20);
        doc.text(`Customer Activity Report: ${customer.name}`, 20, 20);

        doc.setFontSize(10);
        doc.text(`Email: ${customer.email}`, 20, 28);
        doc.text(`Phone: ${customer.phone || 'N/A'}`, 20, 33);
        doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 20, 38);

        const tableColumn = ["Order ID", "Date", "Status", "Items", "Total"];
        const tableRows: any[] = [];

        orders.forEach(order => {
            tableRows.push([
                order.id || order._id,
                new Date(order.created_at || order.date).toLocaleDateString(),
                order.status,
                (order.orderItems?.length || order.items?.length || 0),
                `INR ${order.totalPrice || order.total || 0}`
            ]);
        });

        autoTable(doc, {
            startY: 50,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [44, 24, 16] }
        });

        const totalSpent = orders.reduce((acc, curr) => acc + (curr.totalPrice || curr.total || 0), 0);
        const finalY = (doc as any).lastAutoTable.finalY + 15;

        doc.setFontSize(14);
        doc.text(`Total Lifetime Orders: ${orders.length}`, 20, finalY);
        doc.text(`Total Lifetime Value: INR ${totalSpent}`, 20, finalY + 8);

        doc.save(`Report_${customer.name.replace(/\s+/g, '_')}.pdf`);
    } catch (err: any) {
        console.error("Report Error:", err);
        alert("Failed to generate report.");
    }
};

export const generateMonthlySalesReport = (orders: any[]) => {
    try {
        const doc = new jsPDF() as any;
        const now = new Date();
        const monthName = now.toLocaleString('default', { month: 'long' });
        const year = now.getFullYear();

        doc.setFontSize(22);
        doc.setTextColor(44, 24, 16);
        doc.text("Sales Report", 20, 30);

        doc.setFontSize(12);
        doc.setTextColor(150, 150, 150);
        doc.text(`Period: ${monthName} ${year}`, 20, 38);

        // Filter orders for the current month
        const currentMonthOrders = orders.filter(order => {
            const date = new Date(order.created_at || order.date);
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        });

        // Summary Stats
        const totalRevenue = currentMonthOrders.reduce((acc, curr) => acc + (curr.totalPrice || curr.total || 0), 0);
        const paidOrders = currentMonthOrders.filter(o => o.status === 'Paid' || o.status === 'Delivered');
        const pendingOrders = currentMonthOrders.filter(o => o.status === 'Pending');

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Total Orders: ${currentMonthOrders.length}`, 20, 55);
        doc.text(`Successful Sales: ${paidOrders.length}`, 20, 60);
        doc.text(`Pending Orders: ${pendingOrders.length}`, 20, 65);

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(`Total Revenue: INR ${totalRevenue}`, 120, 60);
        doc.setFont("helvetica", "normal");

        // Table
        const tableColumn = ["ID", "Date", "Customer", "Items", "Status", "Amount"];
        const tableRows: any[] = [];

        currentMonthOrders.forEach(order => {
            tableRows.push([
                (order.id || order._id).substring(0, 8),
                new Date(order.created_at || order.date).toLocaleDateString(),
                order.user_name || order.customer?.name || order.user?.name || "Customer",
                (order.orderItems?.length || order.items?.length || 0),
                order.status,
                `INR ${order.totalPrice || order.total || 0}`
            ]);
        });

        autoTable(doc, {
            startY: 80,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [44, 24, 16] }
        });

        doc.save(`Sales_Report_${monthName}_${year}.pdf`);
    } catch (err: any) {
        console.error("Sales Report Error:", err);
        alert("Failed to generate sales report.");
    }
};

