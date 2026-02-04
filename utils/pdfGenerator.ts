import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, User, CartItem } from '../types';

export const generateInvoice = (order: any, user: any | null) => {
    try {
        const doc = new jsPDF() as any;
        const brandName = "BEAN TRADITION";
        const brandSlogan = "Roast • Grind • Brew";
        const gstNo = "36FAEPR9507L1Z1";
        const fssaiNo = "23625029000985";
        const contactEmail = "beantradition@gmail.com";
        const contactMobile = "+91-7075852734";

        // Header - Left Side (Brand Branding)
        doc.setFontSize(22);
        doc.setTextColor(44, 24, 16); // coffee-900
        doc.setFont("helvetica", "bold");
        doc.text(brandName, 20, 25);

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        doc.text(brandSlogan, 20, 31);

        doc.setTextColor(60, 60, 60);
        doc.text(`GSTIN: ${gstNo}`, 20, 38);
        doc.text(`FSSAI: ${fssaiNo}`, 20, 43);
        doc.text(`Email: ${contactEmail}`, 20, 48);
        doc.text(`Mobile: ${contactMobile}`, 20, 53);

        // Header - Right Side (Invoice Label)
        doc.setFontSize(18);
        doc.setTextColor(44, 24, 16);
        doc.setFont("helvetica", "bold");
        doc.text("TAX INVOICE", 150, 25);

        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.text(`Invoice No: ${order.order_number || order.id || order._id}`, 140, 32);
        doc.text(`Date: ${order.date || new Date(order.created_at).toLocaleDateString()}`, 140, 37);
        doc.text(`Payment: ${order.paymentMethod || 'Online'}`, 140, 42);

        // Horizontal Line
        doc.setDrawColor(210, 180, 140);
        doc.line(20, 58, 190, 58);

        // Billing Details
        const customerInfo = order.customer || order.shippingAddress || {};
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("BILL TO:", 20, 68);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(customerInfo.name || order.user_name || user?.name || "Customer", 20, 74);
        doc.text(`Phone: ${customerInfo.phone || user?.phone || "N/A"}`, 20, 79);
        doc.text(customerInfo.address || "", 20, 84, { maxWidth: 80 });
        doc.text(`${customerInfo.city || ""}${customerInfo.city ? ',' : ''} ${customerInfo.pincode || ""}`, 20, 94);
        doc.text("India", 20, 99);

        // Table Content
        const tableColumn = ["Sl", "Product Description", "HSN", "Qty", "Price", "IGST", "Subtotal"];
        const tableRows: any[] = [];

        let totalTaxableValue = 0;
        let totalIGST = 0;

        const items = order.items || order.orderItems || [];
        items.forEach((item: any, index: number) => {
            const price = item.price || (item.selectedVariant ? item.selectedVariant.price : 0);
            const category = item.category || "";

            // Determine HSN and Tax Rate
            // Beans/Filter: 0901, 5%. Instant: 2101, 18%
            let hsn = "0901";
            let gstRate = 0.05;

            if (category.toLowerCase().includes("instant")) {
                hsn = "2101";
                gstRate = 0.18;
            }

            // Calculation (Assuming price is inclusive of tax)
            const taxableValue = (price * item.quantity) / (1 + gstRate);
            const igstAmount = (price * item.quantity) - taxableValue;

            totalTaxableValue += taxableValue;
            totalIGST += igstAmount;

            const profile = (item.roast || item.selectedRoast || item.intensity || item.selectedIntensity);
            const desc = `${item.name}${profile ? ` (${profile})` : ''} - ${item.weight || item.selectedVariant?.weight || '-'}`;

            const itemData = [
                index + 1,
                desc,
                hsn,
                item.quantity,
                `INR ${price.toFixed(2)}`,
                `${(gstRate * 100)}%`,
                `INR ${(price * item.quantity).toFixed(2)}`
            ];
            tableRows.push(itemData);
        });

        autoTable(doc, {
            startY: 110,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [44, 24, 16], textColor: [255, 255, 255], fontSize: 9 },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 60 },
                2: { cellWidth: 15 },
                3: { cellWidth: 10 },
                4: { cellWidth: 25 },
                5: { cellWidth: 15 },
                6: { cellWidth: 35 }
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;

        // Summary Section
        const totalPrice = order.total || order.totalPrice || 0;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Taxable Value:", 130, finalY);
        doc.text(`INR ${totalTaxableValue.toFixed(2)}`, 170, finalY, { align: 'right' });

        doc.text("Total IGST:", 130, finalY + 6);
        doc.text(`INR ${totalIGST.toFixed(2)}`, 170, finalY + 6, { align: 'right' });

        doc.setDrawColor(200, 200, 200);
        doc.line(130, finalY + 9, 180, finalY + 9);

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(44, 24, 16);
        doc.text("GRAND TOTAL:", 130, finalY + 16);
        doc.text(`INR ${totalPrice.toFixed(2)}`, 170, finalY + 16, { align: 'right' });

        // Amount in words placeholder if needed, otherwise footer
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 100, 100);
        doc.text("Total amount is inclusive of applicable GST.", 20, finalY + 30);

        // Footer
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150, 150, 150);
        doc.text("Thank you for your business!", 105, 280, { align: "center" });
        doc.text("This is a computer generated invoice.", 105, 285, { align: "center" });

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

