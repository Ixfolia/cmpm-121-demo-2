export default {
  base: Deno.env.get("REPO_NAME") || "/project",
// vite.config.js
  server: {
    port: 5173, // Ensure this port matches the one you're using
    hmr: {
      // Specify the port for HMR if necessary
      port: 5173,
    },
  },

};
