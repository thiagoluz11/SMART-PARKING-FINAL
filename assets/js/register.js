const form = document.getElementById('register-form');

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    // Apanhar os dados postos no formulário
    const name = document.getElementById('reg-name').value.trim();
   const email = document.getElementById('reg-email').value.trim();

   const contact = document.getElementById('reg-contact').value.trim();
   const password = document.getElementById('reg-password').value.trim();
   const confirm = document.getElementById('reg-confirm').value.trim();

   //validar as passwords
    if (password !== confirm) {
         View.showPopup({ title: 'Erro', message: 'As passwords não coincidem. Por favor, verifique e tente novamente.', type: 'error' });
         return;
    }

    try{

        // Pedido A API para registar o utilizador
        const response = await fetch('http://localhost:3000/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({name, email, password, contact})
        });
        const data = await response.json();

        if(!response.ok){
            View.showPopup({ title: 'Erro no registo', message: data.error, type: 'error' });
            return;
        }

        View.showPopup({ title: 'Sucesso!', message: 'Registo realizado com sucesso. Agora pode fazer login.', type: 'success', redirect: 'login.html' });

    }catch(err){
        console.error('Error:', err);
        View.showPopup({ title: 'Erro de ligação', message: 'Não foi possível ligar ao servidor. Tente novamente mais tarde.', type: 'error' });
    }

})