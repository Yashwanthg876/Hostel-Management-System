import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface EmailPayload {
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailPayload) => {
    if (!resend) {
        console.log("\n📧 [DEV MODE] Email Simulation");
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${html.substring(0, 100)}... (truncated)`);
        console.log("---------------------------------------------------\n");
        return { success: true, id: 'dev-mode' };
    }

    try {
        const data = await resend.emails.send({
            from: 'Hostel Admin <onboarding@resend.dev>', // Default Resend testing domain
            to,
            subject,
            html,
        });
        return { success: true, id: data.data?.id };
    } catch (error) {
        console.error("❌ Email Failed:", error);
        return { success: false, error };
    }
};

// TEMPLATES (Simple HTML for now)

export const getComplaintConfirmationTemplate = (name: string, ticketId: string, eta: string) => `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Ticket Received 🎫</h2>
        <p>Hi ${name},</p>
        <p>We received your complaint. Our team is on it!</p>
        <ul>
            <li><strong>Ticket ID:</strong> ${ticketId}</li>
            <li><strong>Estimated Response:</strong> ${eta}</li>
        </ul>
        <p>You can track the status in your dashboard.</p>
    </div>
`;

export const getAdminAlertTemplate = (ticketId: string, category: string, priority: number) => `
    <div style="font-family: sans-serif; padding: 20px; color: #333; start: 2px solid red; background: #fff5f5;">
        <h2 style="color: #c53030;">🚨 High Priority Alert</h2>
        <p>A critical complaint requires immediate attention.</p>
        <ul>
            <li><strong>ID:</strong> ${ticketId}</li>
            <li><strong>Category:</strong> ${category}</li>
            <li><strong>Priority Score:</strong> ${priority}/100</li>
        </ul>
        <a href="http://localhost:3000/admin/queue">View in Dashboard</a>
    </div>
`;

export const getStatusUpdateTemplate = (name: string, ticketId: string, status: string) => `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Status Update 🔄</h2>
        <p>Hi ${name},</p>
        <p>Your complaint (ID: ${ticketId}) has been updated.</p>
        <h3>New Status: <span style="color: ${status === 'RESOLVED' ? 'green' : 'orange'}">${status}</span></h3>
        <p>If this is resolved, please verify it in the portal.</p>
    </div>
`;
