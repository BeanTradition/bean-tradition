
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Order, User, CartItem } from '../types';

export const generateInvoice = (order: Order, user: User | null) => {
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
    doc.text(`Order ID: ${order.id}`, 150, 36);
    doc.text(`Date: ${order.date}`, 150, 42);

    // Horizontal Line
    doc.setDrawColor(210, 180, 140); // gold/coffee tint
    doc.line(20, 50, 190, 50);

    // Billing Details
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 20, 65);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(order.customer.name || user?.name || "Customer", 20, 72);
    doc.text(order.customer.phone || user?.phone || "", 20, 77);
    doc.text(order.customer.address || "", 20, 82);
    doc.text(`${order.customer.city || ""}, ${order.customer.pincode || ""}`, 20, 87);
    doc.text("India", 20, 92);

    // Table
    const tableColumn = ["Product", "Weight", "Roast/Intensity", "Qty", "Price", "Subtotal"];
    const tableRows: any[] = [];

    order.items.forEach((item: any) => {
        const itemData = [
            item.name,
            item.selectedVariant.weight,
            `${item.roast || item.selectedRoast || ''} ${item.intensity || item.selectedIntensity || ''}`.trim() || '-',
            item.quantity,
            `INR ${item.price || item.selectedVariant.price}`,
            `INR ${(item.price || item.selectedVariant.price) * item.quantity}`
        ];
        tableRows.push(itemData);
    });

    doc.autoTable({
        startY: 105,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [44, 24, 16], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totals
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 140, finalY);
    doc.setFont("helvetica", "normal");
    doc.text(`Items Price: INR ${(order as any).itemsPrice || (order as any).totalPrice || order.total}`, 140, finalY + 7);
    doc.text(`Shipping: INR ${(order as any).shippingPrice || 0}`, 140, finalY + 14);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(44, 24, 16);
    doc.text(`Total: INR ${order.total || (order as any).totalPrice}`, 140, finalY + 24);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for choosing Bean Tradition!", 105, 280, { align: "center" });
    doc.text("www.beantradition.in", 105, 285, { align: "center" });

    doc.save(`Invoice_BeanTradition_${order.id}.pdf`);
};

export const generateCustomerReport = (orders: any[], customer: any) => {
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
            order.orderItems?.length || order.items?.length,
            `INR ${order.totalPrice || order.total}`
        ]);
    });

    doc.autoTable({
        startY: 50,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [44, 24, 16] }
    });

    const totalSpent = orders.reduce((acc, curr) => acc + (curr.totalPrice || curr.total), 0);
    const finalY = (doc as any).lastAutoTable.finalY + 15;

    doc.setFontSize(14);
    doc.text(`Total Lifetime Orders: ${orders.length}`, 20, finalY);
    doc.text(`Total Lifetime Value: INR ${totalSpent}`, 20, finalY + 8);

    doc.save(`Report_${customer.name.replace(/\s+/g, '_')}.pdf`);
};
