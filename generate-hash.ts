import bcrypt from 'bcryptjs';

async function generate() {
    const pass = '1234';
    const hash = await bcrypt.hash(pass, 10);
    console.log('Password:', pass);
    console.log('Hash:', hash);

    const compare = await bcrypt.compare(pass, hash);
    console.log('Self-check comparison:', compare);
}

generate();
