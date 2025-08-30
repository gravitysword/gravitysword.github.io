 (async () => {
            const response = await fetch('/view/tags/footer.html');
            const data = await response.text();
            document.getElementById('footer').innerHTML = data;
        })();