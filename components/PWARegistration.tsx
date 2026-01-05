'use client';

import { useEffect } from "react";

export default function PWARegistration() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((reg) => console.log('SW Registered', reg))
                .catch((err) => console.error('SW Registration Failed', err));
        }
    }, []);

    return null;
}
