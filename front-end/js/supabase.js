const SUPABASE_URL = "https://krvxmkdfetbvkhhyhall.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtydnhta2RmZXRidmtoaHloYWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjQ2NzUsImV4cCI6MjA5MjcwMDY3NX0.C8gZ5OJUb-zsQF79Ub_hR0ImbfwLOp-7Arai-9L82lI";

async function uploadImage(file) {
    const token = localStorage.getItem("token");
    
    // Create a new client with the user's auth token to pass Row Level Security (RLS)
    const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    });

    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await client.storage
        .from("images")
        .upload(`public/${fileName}`, file, {
            cacheControl: "3600",
            upsert: false
        });
        
    if (error) throw error;
    
    // In Supabase v2, getPublicUrl returns { data: { publicUrl } }
    const { data: publicURLData } = client.storage.from("images").getPublicUrl(`public/${fileName}`);
    return publicURLData.publicUrl;
}