import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, User, CartItem } from '../types';

export const generateInvoice = (order: any, user: any | null) => {
    try {
        const doc = new jsPDF() as any;
        const brandName = "BEAN TRADITION";
        const brandColor: [number, number, number] = [44, 24, 16]; // #2C1810

        // --- Header Section ---
        // Logo
        try {
            doc.addImage("/assets/logo.png", "PNG", 20, 15, 30, 30);
        } catch (e) {
            // Fallback if logo fails
            doc.setFontSize(20);
            doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
            doc.text("BT", 25, 30);
        }

        // Company Details (Left Align)
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
        doc.text(brandName, 55, 25);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("Premium Coffee Roasters", 55, 30);

        doc.setTextColor(0, 0, 0);
        doc.text(`GSTIN: 36FAEPR9507L1Z1`, 55, 35);
        doc.text(`FSSAI Lic No: 23625029000985`, 55, 39);
        doc.text(`Email: beantradition@gmail.com`, 55, 43);
        doc.text(`Mobile: +91-7075852734`, 55, 47);

        // Invoice Info (Right Align)
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("TAX INVOICE", 140, 25);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const invNo = order.order_number || order.id || order._id;
        doc.text(`Invoice No: ${invNo}`, 140, 35);
        doc.text(`Date: ${order.date || new Date(order.created_at).toLocaleDateString()}`, 140, 40);
        doc.text(`Order ID: ${order.id || order._id}`, 140, 45);

        doc.setDrawColor(200, 200, 200);
        doc.line(20, 55, 190, 55);

        // --- Billing Details ---
        const customerInfo = order.customer || order.shippingAddress || {};
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("BILL TO / SHIP TO:", 20, 65);

        doc.setFont("helvetica", "normal");
        doc.text(customerInfo.name || order.user_name || user?.name || "Customer", 20, 70);
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(customerInfo.address || "", 20, 75, { maxWidth: 80 });
        doc.text(`${customerInfo.city || ""}, ${customerInfo.pincode || ""}`, 20, 85);
        doc.text(`Phone: ${customerInfo.phone || user?.phone || "N/A"}`, 20, 90);

        // --- Table Section ---
        const tableColumn = [
            "Sl.",
            "Product Description",
            "HSN",
            "Qty",
            "Price",
            "Taxable",
            "IGST %",
            "Total"
        ];
        const tableRows: any[] = [];

        const items = order.items || order.orderItems || [];
        let totalTaxableValue = 0;
        let totalIgstAmount = 0;

        items.forEach((item: any, index: number) => {
            const price = item.price || (item.selectedVariant ? item.selectedVariant.price : 0);
            const qty = item.quantity || 1;
            const totalItemAmount = price * qty;

            const itemName = (item.name || "").toLowerCase();
            let hsn = "0901";
            let taxRate = 5;

            if (itemName.includes("instant")) {
                hsn = "2101";
                taxRate = 18;
            }

            const taxableValue = totalItemAmount / (1 + (taxRate / 100));
            const igstAmount = totalItemAmount - taxableValue;

            totalTaxableValue += taxableValue;
            totalIgstAmount += igstAmount;

            const profile = (item.roast || item.selectedRoast || item.intensity || item.selectedIntensity || '');
            const desc = `${item.name} ${item.weight || (item.selectedVariant?.weight || '')} ${profile}`.trim();

            tableRows.push([
                index + 1,
                desc,
                hsn,
                qty,
                price.toFixed(2),
                taxableValue.toFixed(2),
                `${taxRate}%`,
                totalItemAmount.toFixed(2)
            ]);
        });

        autoTable(doc, {
            startY: 100,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: brandColor, textColor: [255, 255, 255], fontSize: 8 },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 70 },
                2: { cellWidth: 15 },
                3: { cellWidth: 10 },
                4: { cellWidth: 20 },
                5: { cellWidth: 20 },
                6: { cellWidth: 15 },
                7: { cellWidth: 30 },
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;

        // --- Summary Section ---
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("SUMMARY", 130, finalY);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Total Taxable Value:`, 130, finalY + 7);
        doc.text(`INR ${totalTaxableValue.toFixed(2)}`, 185, finalY + 7, { align: "right" });

        doc.text(`Total IGST Amount:`, 130, finalY + 12);
        doc.text(`INR ${totalIgstAmount.toFixed(2)}`, 185, finalY + 12, { align: "right" });

        doc.setDrawColor(200, 200, 200);
        doc.line(130, finalY + 16, 190, finalY + 16);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(`Grand Total:`, 130, finalY + 22);
        const grandTotal = (order.total || order.totalPrice || 0);
        doc.text(`INR ${Number(grandTotal).toFixed(2)}`, 185, finalY + 22, { align: "right" });

        // --- Notes & Footer ---
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("Notes:", 20, finalY + 7);
        doc.text("1. All prices are inclusive of GST.", 20, finalY + 12);
        doc.text("2. This is a computer generated invoice.", 20, finalY + 17);

        // Signature Area
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("For BEAN TRADITION", 140, finalY + 45);
        doc.text("Authorized Signatory", 140, finalY + 55);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("www.beantradition.in | beantradition@gmail.com | +91-7075852734", 105, 285, { align: "center" });

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

