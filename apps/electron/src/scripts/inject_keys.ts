import { Database } from '../database/Database';
import * as path from 'path';
import * as fs from 'fs';

async function inject() {
    console.log("Starting API Key injection...");
    const db = new Database();
    await db.initialize();

    const settings = {
        'google_api_key': process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '',
        'openai_api_key': process.env.OPENAI_API_KEY || '',
        'ai_provider': process.env.AI_PROVIDER || 'google',
        'ai_model_id': process.env.AI_MODEL_ID || 'gemini-1.5-flash'
    };

    try {
        await db.saveSettings(settings);
        console.log("Successfully injected API keys into the database.");
        
        // Also log the current settings to verify
        const current = await db.getSettings();
        console.log("Current AI Provider:", current.ai_provider);
        console.log("Current Google Key (masked):", current.google_api_key?.substring(0, 8) + "...");
    } catch (err) {
        console.error("Failed to inject keys:", err);
    } finally {
        process.exit(0);
    }
}

inject().catch(console.error);
