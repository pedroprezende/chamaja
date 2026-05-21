import fs from "fs";
import path from "path";

const dir = path.join("node_modules", "react-native-css-interop", ".cache");
const file = path.join(dir, "web.css");

try {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "/* pre-created by build script */\n");
    console.log(`✅ Created file: ${file}`);
  } else {
    console.log(`ℹ️ Cache file already exists: ${file}`);
  }
} catch (error) {
  console.error("⚠️ Failed to pre-create react-native-css-interop cache:", error);
}
