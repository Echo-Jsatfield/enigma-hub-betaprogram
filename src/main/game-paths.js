import { app } from 'electron';
import { join, dirname } from 'path';
import fs from 'fs';

function getConfigPath() {
  // For both dev and production, use AppData
  const appDataPath = app.getPath('userData');
  return join(appDataPath, 'game-paths.json');
}

export function getGamePaths() {
  try {
    const configPath = getConfigPath();
    console.log('[GamePaths] Looking for config at:', configPath);
    
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      const paths = JSON.parse(data);
      console.log('[GamePaths] Loaded paths:', paths);
      return paths;
    } else {
      console.log('[GamePaths] Config file not found');
    }
  } catch (error) {
    console.error('[GamePaths] Error reading config:', error);
  }
  return { ets2: null, ats: null };
}

export function saveGamePaths(ets2Path, atsPath) {
  try {
    const configPath = getConfigPath();
    const configDir = dirname(configPath);
    
    // Ensure directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    const config = {
      ets2: ets2Path,
      ats: atsPath
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('[GamePaths] Paths saved to:', configPath);
    return true;
  } catch (error) {
    console.error('[GamePaths] Error saving config:', error);
    return false;
  }
}

export function updateGamePlugins() {
  const paths = getGamePaths();
  
  if (!paths.ets2 || !paths.ats) {
    console.log('[GamePaths] No saved game paths found');
    return false;
  }
  
  try {
    // Get plugin source - works for both Squirrel and dev
    let pluginSource;
    
    if (app.isPackaged) {
      // In packaged app (Squirrel installs to Local/EnigmaHub/)
      pluginSource = join(process.resourcesPath, 'app.asar.unpacked', 'src', 'telemetry');
    } else {
      // In dev
      pluginSource = join(process.cwd(), 'src', 'telemetry');
    }
    
    console.log('[GamePaths] Plugin source:', pluginSource);
    
    // Verify source exists
    if (!fs.existsSync(pluginSource)) {
      console.error('[GamePaths] Plugin source not found!');
      return false;
    }
    
    const corePlugin = join(pluginSource, 'enigma_telemetry_core.dll');
    const scsPlugin = join(pluginSource, 'scs-telemetry.dll');
    
    if (!fs.existsSync(corePlugin) || !fs.existsSync(scsPlugin)) {
      console.error('[GamePaths] Plugin DLLs not found!');
      return false;
    }
    
    console.log('[GamePaths] Found plugins');
    
    // Update ETS2
    if (fs.existsSync(paths.ets2)) {
      const ets2Plugins = join(paths.ets2, 'bin', 'win_x64', 'plugins');
      const ets2Enigma = join(ets2Plugins, 'enigma');
      
      if (!fs.existsSync(ets2Enigma)) {
        fs.mkdirSync(ets2Enigma, { recursive: true });
      }
      
      fs.copyFileSync(scsPlugin, join(ets2Plugins, 'scs-telemetry.dll'));
      fs.copyFileSync(corePlugin, join(ets2Enigma, 'enigma_telemetry_core.dll'));
      console.log('[GamePaths] ✅ ETS2 plugins updated');
    }
    
    // Update ATS
    if (fs.existsSync(paths.ats)) {
      const atsPlugins = join(paths.ats, 'bin', 'win_x64', 'plugins');
      const atsEnigma = join(atsPlugins, 'enigma');
      
      if (!fs.existsSync(atsEnigma)) {
        fs.mkdirSync(atsEnigma, { recursive: true });
      }
      
      fs.copyFileSync(scsPlugin, join(atsPlugins, 'scs-telemetry.dll'));
      fs.copyFileSync(corePlugin, join(atsEnigma, 'enigma_telemetry_core.dll'));
      console.log('[GamePaths] ✅ ATS plugins updated');
    }
    
    return true;
  } catch (error) {
    console.error('[GamePaths] Error updating plugins:', error);
    return false;
  }
}