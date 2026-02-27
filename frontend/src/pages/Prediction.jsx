import React, { useState } from 'react';
import { predictAQI } from '../services/api';
import AQICard from '../components/AQICard';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function Prediction() {
    const [formData, setFormData] = useState({
        PM2_5: 45.2, PM10: 89.1, NO2: 34.5, CO: 1.2, SO2: 12.4, O3: 45.8, NH3: 5.6,
        hour: new Date().getHours(), day: new Date().getDate(), month: new Date().getMonth() + 1, weekday: new Date().getDay()
    });

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: parseFloat(e.target.value) || 0 });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await predictAQI({ sensor_id: 1, ...formData });
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to predict. Check backend connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight mb-2">AQI Prediction Engine</h2>
                <p className="text-slate-500">Input atmospheric parameters to forecast air quality index and receive health advisories instantly.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 glass-card p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <h3 className="font-semibold text-lg border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Pollutant Levels (µg/m³)</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {['PM2_5', 'PM10', 'NO2', 'CO', 'SO2', 'O3', 'NH3'].map((field) => (
                                <div key={field}>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{field.replace('_', '.')}</label>
                                    <input type="number" step="0.1" name={field} value={formData[field]} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none" required />
                                </div>
                            ))}
                        </div>

                        <h3 className="font-semibold text-lg border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 mt-6">Temporal Features</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {['hour', 'day', 'month', 'weekday'].map((field) => (
                                <div key={field}>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{field}</label>
                                    <input type="number" name={field} value={formData[field]} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none" required />
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 flex items-center gap-4">
                            <button type="submit" disabled={loading} className="btn-primary min-w-[140px]">
                                {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Predict AQI'}
                            </button>
                            {error && <span className="text-red-500 text-sm font-medium flex items-center gap-1"><AlertCircle size={16} /> {error}</span>}
                        </div>
                    </form>
                </div>

                <div className="md:col-span-1 space-y-6">
                    <AQICard aqi={result?.predicted_AQI} title="Predicted AQI" className="h-[300px]" />
                    {result && (
                        <div className="glass-card p-5 border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-900/10">
                            <h4 className="font-bold mb-2 flex items-center gap-2"><ShieldCheck className="text-blue-500" size={20} /> Health Advisory</h4>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Based on the projection, the air quality falls into the '{result.category}' category. Please take appropriate precautions.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
