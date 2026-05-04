import { useState } from 'react';

export default function PricingTab({ course, onSave, formId }) {
    const [f, setF] = useState({
        is_paid: String(course.is_paid ? 1 : 0),
        price: course.price || '',
        discount_flag: course.discount_flag ? '1' : '',
        discounted_price: course.discounted_price || '',
        expiry_period: course.expiry_period ? 'limited_time' : 'lifetime',
        number_of_month: course.expiry_period || '',
    });
    const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

    const submit = (e) => {
        e.preventDefault();
        const fd = new FormData();
        Object.entries(f).forEach(([k, v]) => fd.append(k, v));
        onSave(fd);
    };

    return (
        <form id={formId} onSubmit={submit}>
            <div className="mb-3">
                <div className="grid grid-cols-12 gap-0">
                    <label className="col-span-2 ol-form-label">Pricing</label>
                    <div className="col-span-10">
                        <select className="ol-form-control" value={f.is_paid} onChange={(e) => set('is_paid', e.target.value)}>
                            <option value="0">Free</option>
                            <option value="1">Paid</option>
                        </select>
                    </div>
                </div>
            </div>
            {f.is_paid === '1' && (
                <>
                    <div className="mb-3">
                        <div className="grid grid-cols-12 gap-0">
                            <label className="col-span-2 ol-form-label">Price</label>
                            <div className="col-span-10">
                                <input className="ol-form-control" type="number" value={f.price} onChange={(e) => set('price', e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div className="mb-3 pl-[calc(2/12*100%)]">
                        <div className="flex items-center gap-2">
                            <input id="dflag" className="w-4 h-4 accent-skin" type="checkbox" checked={f.discount_flag === '1'}
                                onChange={(e) => set('discount_flag', e.target.checked ? '1' : '')} />
                            <label className="text-[14px] text-dark" htmlFor="dflag">Apply discount</label>
                        </div>
                    </div>
                    {f.discount_flag === '1' && (
                        <div className="mb-3">
                            <div className="grid grid-cols-12 gap-0">
                                <label className="col-span-2 ol-form-label">Discounted Price</label>
                                <div className="col-span-10">
                                    <input className="ol-form-control" type="number" value={f.discounted_price} onChange={(e) => set('discounted_price', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
            <div className="mb-3">
                <div className="grid grid-cols-12 gap-0">
                    <label className="col-span-2 ol-form-label">Expiry</label>
                    <div className="col-span-10">
                        <select className="ol-form-control" value={f.expiry_period} onChange={(e) => set('expiry_period', e.target.value)}>
                            <option value="lifetime">Lifetime</option>
                            <option value="limited_time">Limited time (months)</option>
                        </select>
                    </div>
                </div>
            </div>
            {f.expiry_period === 'limited_time' && (
                <div className="mb-4">
                    <div className="grid grid-cols-12 gap-0">
                        <label className="col-span-2 ol-form-label">Number of months</label>
                        <div className="col-span-10">
                            <input className="ol-form-control" type="number" value={f.number_of_month} onChange={(e) => set('number_of_month', e.target.value)} />
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}
