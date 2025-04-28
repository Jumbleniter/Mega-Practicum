const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REQUIRED_DEPENDENCIES = [
  'express',
  'express-session',
  'mongoose',
  'bcrypt',
  'bcryptjs',
  'jsonwebtoken',
  'cors',
  'dotenv',
  'uuid'
];

function checkDependencies() {
  console.log('Checking dependencies...');
  
  try {
    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    
    // Check if node_modules exists
    if (!fs.existsSync(path.join(__dirname, '..', 'node_modules'))) {
      console.log('node_modules not found. Running npm install...');
      execSync('npm install', { stdio: 'inherit' });
    }
    
    // Check each required dependency
    const missingDeps = REQUIRED_DEPENDENCIES.filter(dep => {
      try {
        require.resolve(dep);
        return false;
      } catch (e) {
        console.log(`Dependency ${dep} not found in node_modules`);
        return true;
      }
    });
    
    if (missingDeps.length > 0) {
      console.error('Missing dependencies:', missingDeps.join(', '));
      console.log('Installing missing dependencies...');
      execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
      
      // Verify installation
      const stillMissing = missingDeps.filter(dep => {
        try {
          require.resolve(dep);
          return false;
        } catch (e) {
          return true;
        }
      });
      
      if (stillMissing.length > 0) {
        console.error('Failed to install dependencies:', stillMissing.join(', '));
        process.exit(1);
      }
    }
    
    console.log('All dependencies are installed and up to date.');
    
    // Check for any peer dependencies
    try {
      const { dependencies } = packageJson;
      Object.keys(dependencies).forEach(dep => {
        try {
          require.resolve(dep);
        } catch (e) {
          console.warn(`Warning: Peer dependency ${dep} might be missing`);
        }
      });
    } catch (error) {
      console.warn('Warning: Could not check peer dependencies:', error.message);
    }
  } catch (error) {
    console.error('Error checking dependencies:', error);
    process.exit(1);
  }
}

checkDependencies(); 