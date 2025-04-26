import express from "express";
import { dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import methodOverride from "method-override";
import fs from "fs";
import path from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// Set the correct views directory back one folder from the current directory
app.set("views", path.resolve(__dirname, "views"));

// Middleware for serving static files and parsing request body
app.use(express.static(path.resolve(__dirname, "public")));


// Set EJS as view engine
app.set("view engine", "ejs");

app.use(methodOverride("_method"));

app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));

// Dynamically load all route files from the routes directory
const routesPath = path.resolve(__dirname, "./routes");
if (!fs.existsSync(routesPath)) {
  console.warn("Warning: 'routes' directory does not exist. No routes will be loaded.");
}
let routeFiles = [];
if (!fs.existsSync(routesPath)) {
  console.warn("Warning: 'routes' directory does not exist. No routes will be loaded.");
} else {
  try {
    routeFiles = fs.readdirSync(routesPath).filter((file) => file.endsWith(".js"));
    routeFiles.forEach((file) => {
      console.log(`Found route file: ${file}`);
    });
  } catch (err) {
    console.error(`Error reading the 'routes' directory:`, err);
  }
}

(async () => {
  try {
    const routePromises = routeFiles.map(async (file) => {
      try {
        const route = await import(pathToFileURL(path.join(routesPath, file)).href);
        if (route && route.default) {
          app.use("/", route.default);
        } else {
          console.error(`Route file ${file} does not export a default object.`);
        }
      } catch (err) {
        console.error(`Error loading route file ${file}:`, err);
      }
    });
    await Promise.all(routePromises);
    app.listen(port, () => {
      console.log(`Listening on port ${port}`);
    });
  } catch (err) {
    console.error("Error initializing routes:", err);
  }
})();
