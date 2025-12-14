import { GoogleGenAI } from "@google/genai";
import { Renter, Transaction, TransactionStatus } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePaymentReminder = async (renter: Renter, amount: number, dueDate: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Draft a polite but firm WhatsApp message to a tenant named ${renter.name}.
      They owe ${amount} INR for rent/bills. The due date was/is ${dueDate}.
      Keep it professional, short, and friendly. Include a placeholder for UPI ID.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate reminder. Please try again.";
  }
};

export const generateFinancialInsight = async (renters: Renter[], transactions: Transaction[]) => {
  // Prepare a lightweight summary of data to avoid token limits
  const summaryData = {
    totalRenters: renters.length,
    totalTransactions: transactions.length,
    recentTransactions: transactions.slice(0, 10), // Last 10
    pendingCount: transactions.filter(t => t.status === TransactionStatus.PENDING || t.status === TransactionStatus.PARTIAL).length
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a financial assistant for a property manager. Analyze this JSON summary of rental data:
      ${JSON.stringify(summaryData)}

      Provide 3 key insights in bullet points. Focus on collection efficiency, pending dues, and overall health.
      Do not use markdown formatting like bolding, just plain text with bullet points.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Could not generate insights at this time.";
  }
};

export const chatWithData = async (query: string, renters: Renter[], transactions: Transaction[]) => {
    const context = JSON.stringify({
        renters: renters.map(r => ({ name: r.name, unit: r.unitNumber, balance: r.balance })),
        pendingTransactions: transactions.filter(t => t.status !== TransactionStatus.PAID).map(t => ({ 
            amount: t.totalAmount, type: t.type, dueDate: t.dueDate 
        }))
    });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Context Data: ${context}.
            User Query: "${query}"
            Answer the user's question based strictly on the context data provided. Keep it concise.`,
        });
        return response.text;
    } catch (error) {
        return "Sorry, I encountered an error processing your request.";
    }
}