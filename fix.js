const fs = require('fs'); 
const files = ['index.html', 'events.html', 'register.html', 'admin.html', 'login.html']; 

files.forEach(f => { 
  let text = fs.readFileSync(f, 'utf8'); 
  text = text.replace(/<link rel="stylesheet" href="upgrades\.css">\s*/g, ''); 
  text = text.replace(/\$17,000/g, '₹14 Lakhs'); 
  text = text.replace(/\$17K/g, '₹14L'); 
  text = text.replace(/\$10,000/g, '₹8,00,000'); 
  text = text.replace(/\$5,000/g, '₹4,00,000'); 
  text = text.replace(/\$2,000/g, '₹1,50,000'); 
  fs.writeFileSync(f, text); 
});
console.log('done');
