import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, User, CartItem } from '../types';

export const generateInvoice = (order: any, user: any | null) => {
    try {
        const doc = new jsPDF() as any;
        const brandName = "Bean Tradition";
        const brandSlogan = "Roast • Grind • Brew";

        // Header
        doc.setFontSize(22);
        doc.setTextColor(44, 24, 16); // coffee-900
        doc.text(brandName, 20, 30);

        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(brandSlogan, 20, 36);

        doc.setFontSize(18);
        doc.setTextColor(44, 24, 16);
        doc.text("INVOICE", 150, 30);

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Order Number: ${order.order_number || order.id || order._id}`, 150, 36);
        doc.text(`Date: ${order.date || new Date(order.created_at).toLocaleDateString()}`, 150, 42);
        doc.text(`Invoice No: ${order.order_number || order.id || order._id}`, 150, 48);

        // Horizontal Line
        doc.setDrawColor(210, 180, 140); // gold/coffee tint
        doc.line(20, 50, 190, 50);

        // Billing Details - Handle different property names (customer vs shippingAddress)
        const customerInfo = order.customer || order.shippingAddress || {};
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Bill To:", 20, 65);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(customerInfo.name || order.user_name || user?.name || "Customer", 20, 72);
        doc.text(customerInfo.phone || user?.phone || "", 20, 77);
        doc.text(customerInfo.address || "", 20, 82);
        doc.text(`${customerInfo.city || ""}, ${customerInfo.pincode || ""}`, 20, 87);
        doc.text("India", 20, 92);

        // Table
        const tableColumn = ["Product", "Weight", "Roast/Intensity", "Qty", "Price", "Subtotal"];
        const tableRows: any[] = [];

        // Correctly handle items vs orderItems
        const items = order.items || order.orderItems || [];
        items.forEach((item: any) => {
            const price = item.price || (item.selectedVariant ? item.selectedVariant.price : 0);
            const weight = item.weight || (item.selectedVariant ? item.selectedVariant.weight : '-');
            const profile = (item.roast || item.selectedRoast || item.intensity || item.selectedIntensity || '-');

            const itemData = [
                item.name,
                weight,
                profile,
                item.quantity,
                `INR ${price}`,
                `INR ${price * item.quantity}`
            ];
            tableRows.push(itemData);
        });

        autoTable(doc, {
            startY: 105,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [44, 24, 16], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;

        // Totals
        const totalPrice = order.total || order.totalPrice || 0;
        doc.setFont("helvetica", "bold");
        doc.text("Summary", 140, finalY);
        doc.setFont("helvetica", "normal");
        doc.text(`Subtotal: INR ${totalPrice}`, 140, finalY + 7);
        doc.text(`Shipping: INR 0`, 140, finalY + 14);

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(44, 24, 16);
        doc.text(`Total: INR ${totalPrice}`, 140, finalY + 24);

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text("Thank you for choosing Bean Tradition!", 105, 280, { align: "center" });
        doc.text("www.beantradition.in", 105, 285, { align: "center" });

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

