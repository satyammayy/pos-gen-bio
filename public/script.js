document.getElementById('regForm').addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json());
  
    if (res.ok) {
      // Redirect to print page with all form data
      const params = new URLSearchParams({
        ...data,
        id: res.id,
        print: 'true'
      });
      window.location.href = `/print.html?${params.toString()}`;
    } else {
      alert('Error — see console.');
    }
  });
  