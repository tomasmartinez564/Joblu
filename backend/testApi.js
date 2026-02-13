async function test() {
    try {
        const res = await fetch("http://localhost:3000/api/jobs");
        if (!res.ok) {
            const err = await res.json();
            console.error("API error:", res.status, err);
            return;
        }
        const data = await res.json();
        console.log(`📡 API devolvió ${data.length} empleos.`);
        if (data.length > 0) {
            console.log("📝 Primer empleo:", JSON.stringify(data[0], null, 2));
        }
    } catch (err) {
        console.error("❌ Error de conexión:", err);
    }
}

test();
