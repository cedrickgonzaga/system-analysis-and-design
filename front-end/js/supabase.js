const SUPABASE_URL = "https://krvxmkdfetbvkhhyhall.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtydnhta2RmZXRidmtoaHloYWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjQ2NzUsImV4cCI6MjA5MjcwMDY3NX0.C8gZ5OJUb-zsQF79Ub_hR0ImbfwLOp-7Arai-9L82lI";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function uploadImage(file) {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabaseClient.storage
        .from("images")
        .upload(`public/${fileName}`, file, {
            cacheControl: "3600",
            upsert: false
        });
    if (error) throw error;
    const { publicURL } = supabaseClient.storage.from("images").getPublicUrl(`public/${fileName}`);
    return publicURL;
}