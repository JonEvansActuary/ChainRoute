(function () {
  const inputEl = document.getElementById('input');
  const verifyBtn = document.getElementById('verifyBtn');
  const loading = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const resultSection = document.getElementById('result');
  const statusBadge = document.getElementById('statusBadge');
  const genesisLine = document.getElementById('genesisLine');
  const timeline = document.getElementById('timeline');
  const errorsBlock = document.getElementById('errorsBlock');

  function hideAll() {
    loading.classList.add('hidden');
    errorEl.classList.add('hidden');
    resultSection.classList.add('hidden');
    errorsBlock.classList.add('hidden');
  }

  function showError(msg) {
    hideAll();
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  }

  /** Normalize pasted URLs to the ID/hash the API expects */
  function normalizeInput(raw) {
    const s = (raw || '').trim();
    const polyMatch = s.match(/tx\/(0x[0-9a-fA-F]{64})/i);
    if (polyMatch) return polyMatch[1];
    const arweaveMatch = s.match(/(?:arweave\.net|viewblock\.io\/arweave\/tx)\/([A-Za-z0-9_-]{43})/);
    if (arweaveMatch) return arweaveMatch[1];
    return s;
  }

  verifyBtn.addEventListener('click', async () => {
    const raw = inputEl.value.trim();
    if (!raw) {
      showError('Please enter a Polygon tx hash, Arweave ID, or genesis hash.');
      return;
    }

    const input = normalizeInput(raw);

    hideAll();
    loading.classList.remove('hidden');
    verifyBtn.disabled = true;

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();

      loading.classList.add('hidden');
      verifyBtn.disabled = false;

      if (!res.ok) {
        showError(data.error || 'Verification request failed.');
        return;
      }

      // Show result
      resultSection.classList.remove('hidden');
      statusBadge.textContent = data.status === 'verified' ? 'Verified' : 'Invalid';
      statusBadge.className = 'status-badge ' + data.status;

      genesisLine.textContent = 'Genesis: ' + (data.genesisHash ? '0x' + data.genesisHash : '—');
      genesisLine.innerHTML = data.genesisHash
        ? 'Genesis: <a href="https://polygonscan.com/tx/0x' + data.genesisHash + '" target="_blank" rel="noopener">0x' + data.genesisHash + '</a>'
        : 'Genesis: —';

      timeline.innerHTML = '';
      (data.chain || []).forEach((anchor, i) => {
        const li = document.createElement('li');
        li.className = anchor.step === 'genesis' ? 'genesis' : '';

        const stepLabel = anchor.step === 'genesis' ? 'Genesis' : 'Event ' + i;
        li.innerHTML = '<span class="step-label">' + stepLabel + '</span>';

        const txLink = 'https://polygonscan.com/tx/' + anchor.txHash;
        li.innerHTML += '<div class="tx-link"><a href="' + txLink + '" target="_blank" rel="noopener">' + anchor.txHash + '</a></div>';

        if (anchor.delegate) {
          li.innerHTML += '<div class="tx-link">Delegate: ' + anchor.delegate + '</div>';
        }

        if (anchor.arweaveId) {
          const arwUrl = 'https://arweave.net/' + anchor.arweaveId;
          const viewUrl = 'https://viewblock.io/arweave/tx/' + anchor.arweaveId;
          let blobHtml = '<div class="blob-info">Blob: <a href="' + arwUrl + '" target="_blank" rel="noopener">' + anchor.arweaveId + '</a> ';
          if (anchor.blobOk === true) {
            blobHtml += '<span class="blob-ok">✓</span>';
            if (anchor.blobSummary) {
              blobHtml += ' — ' + (anchor.blobSummary.eventType || '') + (anchor.blobSummary.timestamp ? ' (' + anchor.blobSummary.timestamp + ')' : '');
            }
          } else if (anchor.blobOk === false) {
            blobHtml += '<span class="blob-fail">✗ fetch or genesis mismatch</span>';
          }
          blobHtml += '</div>';
          li.innerHTML += blobHtml;
        }

        timeline.appendChild(li);
      });

      if (data.errors && data.errors.length > 0) {
        errorsBlock.classList.remove('hidden');
        errorsBlock.innerHTML = '<strong>Issues:</strong><ul><li>' + data.errors.join('</li><li>') + '</li></ul>';
      } else {
        errorsBlock.classList.add('hidden');
      }
    } catch (e) {
      loading.classList.add('hidden');
      verifyBtn.disabled = false;
      showError('Network error: ' + e.message);
    }
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') verifyBtn.click();
  });
})();
