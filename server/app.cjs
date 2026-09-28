// Start file for cPanel / Phusion Passenger, which loads a CommonJS file.
// The server itself is an ES module, so load it with a dynamic import.
import("./src/index.js").catch((err) => {
  console.error("Failed to load MumWell API:", err);
  process.exit(1);
});
