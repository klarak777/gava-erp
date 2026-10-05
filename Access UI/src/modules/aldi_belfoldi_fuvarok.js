/**
 * GAVA ERP – ALDI Belföldi Fuvarok modul
 */

export function renderAldiBelfoldiFuvarok(container, windowManager) {
  let state = {
    data: [], // Ebbe fognak kerülni az API-ból lekért adatok
    currentPage: 1,
    itemsPerPage: 10,
    filters: {
      truckNum: '',
      plate: '',
      date: '',
      season: 'Season 25-26',
      transporter: 'all',
      missingInvoice: false
    }
  };

  container.innerHTML = '';
  container.style.padding = '0';
  container.style.height = '100%';
  container.style.background = 'var(--bg-main, #f8fafc)';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';

  var view = document.createElement('div');
  view.className = 'module-view fade-in';
  view.style.display = 'flex';
  view.style.flexDirection = 'column';
  view.style.height = '100%';

  view.innerHTML = `
    <!-- FEJLÉC: Cím és logó -->
    <div class="view-header" style="margin-bottom:16px; display:flex; align-items:center; justify-content:space-between;">
      <div style="display:flex; align-items:center; gap:12px;">
        <img src="AldiNord-WorldwideLogo.svg" alt="ALDI" style="height:32px; border-radius:4px;">
        <div>
          <h2 class="view-title">ALDI – Belföldi fuvarok</h2>
          <p class="view-subtitle">Belföldi szállítások és fuvarszámlák kezelése</p>
        </div>
      </div>
    </div>

    <!-- SZŰRŐK SÁVJA -->
    <div class="access-subform" style="margin-top:0; margin-bottom:12px; padding:12px; display:flex; align-items:flex-end; gap:12px; flex-wrap:wrap;">
      <div style="flex:1; min-width:120px;">
        <label style="font-size:11px; font-weight:600; color:#475569; margin-bottom:4px; display:block;">Kamion szám</label>
        <input type="text" id="filter-truck-num" class="access-control-input" style="font-size:12px; padding:4px 8px; height:32px; width:100%; box-sizing:border-box;">
      </div>
      <div style="flex:1; min-width:120px;">
        <label style="font-size:11px; font-weight:600; color:#475569; margin-bottom:4px; display:block;">Rendszám</label>
        <input type="text" id="filter-plate" class="access-control-input" style="font-size:12px; padding:4px 8px; height:32px; width:100%; box-sizing:border-box;">
      </div>
      <div style="flex:1; min-width:120px;">
        <label style="font-size:11px; font-weight:600; color:#475569; margin-bottom:4px; display:block;">Rakodási nap</label>
        <input type="date" id="filter-date" class="access-control-input" style="font-size:12px; padding:4px 8px; height:32px; width:100%; box-sizing:border-box;">
      </div>
      <div style="flex:1; min-width:120px;">
        <label style="font-size:11px; font-weight:600; color:#475569; margin-bottom:4px; display:block;">Szezon</label>
        <select id="filter-season" class="access-control-input" style="font-size:12px; padding:4px 8px; height:32px; width:100%; box-sizing:border-box;">
          <option value="Season 25-26" selected>Season 25-26</option>
          <option value="Season 24-25">Season 24-25</option>
        </select>
      </div>
      <div style="flex:1; min-width:120px;">
        <label style="font-size:11px; font-weight:600; color:#475569; margin-bottom:4px; display:block;">Fuvarozó cég</label>
        <select id="filter-transporter" class="access-control-input" style="font-size:12px; padding:4px 8px; height:32px; width:100%; box-sizing:border-box;">
          <option value="all" selected>-- Összes --</option>
        </select>
      </div>
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px; min-width:150px;">
        <input type="checkbox" id="filter-missing-invoice" style="width:16px; height:16px; cursor:pointer;">
        <label for="filter-missing-invoice" style="font-size:12px; font-weight:600; color:#475569; cursor:pointer;">Hiányzó fuvarszámla</label>
      </div>
      <div>
        <button class="secondary-btn btn-dense" id="btn-clear-filters" style="font-size:12px; font-weight:700; color:#2563eb; background:#ffffff; border:1px solid #2563eb; border-radius:8px; height:32px; line-height:normal; padding:0 22px; box-sizing:border-box; cursor:pointer;">Szűrők törlése</button>
      </div>
    </div>

    <!-- TÁBLÁZAT -->
    <div class="access-subform" style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
      <div style="flex:1; overflow:auto;">
        <table class="access-subform-table" style="font-size:11px; table-layout:auto; width:100%;">
          <thead style="position:sticky; top:0; z-index:1; background:#f8fafc;">
            <tr>
              <th style="padding:8px; font-size:10px;">KAMIONSZÁM</th>
              <th style="padding:8px; font-size:10px;">SZÁLLÍTÁSI NAP</th>
              <th style="padding:8px; font-size:10px;">FUVAROZÓ</th>
              <th style="padding:8px; font-size:10px;">RENDSZÁM</th>
              <th style="padding:8px; font-size:10px;">GAVA RAKLAPSZÁM</th>
              <th style="padding:8px; font-size:10px;">CROSSDOKING RAKLAPSZÁM</th>
              <th style="padding:8px; font-size:10px;">KOMMENT</th>
              <th style="padding:8px; font-size:10px;">FUVARSZÁMLA</th>
            </tr>
          </thead>
          <tbody id="belfoldi-fuvarok-tbody">
          </tbody>
        </table>
      </div>
      
      <!-- LAPOZÓ (Pagination) -->
      <div id="belfoldi-pagination-container" style="display:none; justify-content:space-between; align-items:center; padding:12px; border-top:1px solid #e2e8f0; margin-top:auto; background:#f8fafc;">
      </div>
    </div>
  `;

  container.appendChild(view);

  const tbody = view.querySelector('#belfoldi-fuvarok-tbody');
  const paginationContainer = view.querySelector('#belfoldi-pagination-container');

  function renderTable() {
    let filteredData = state.data;
    const totalItems = filteredData.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / state.itemsPerPage));
    if (state.currentPage > totalPages) {
      state.currentPage = totalPages;
    }

    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + state.itemsPerPage);

    if (currentData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#64748b;">Nincsenek megjeleníthető adatok</td></tr>';
    } else {
      tbody.innerHTML = currentData.map(row => `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:8px;">${row.truckNum || ''}</td>
          <td style="padding:8px;">${row.date || ''}</td>
          <td style="padding:8px;">${row.transporter || ''}</td>
          <td style="padding:8px;">${row.plate || ''}</td>
          <td style="padding:8px;">${row.gavaPallets || ''}</td>
          <td style="padding:8px;">${row.crossdockPallets || ''}</td>
          <td style="padding:8px;">${row.comment || ''}</td>
          <td style="padding:8px;">${row.invoice || ''}</td>
        </tr>
      `).join('');
    }

    if (totalItems > 10) {
      paginationContainer.style.display = 'flex';
      
      let paginationHtml = `
        <span style="font-size:12px; color:#64748b;">Összesen: ${totalItems} tétel</span>
        <div style="display:flex; gap:4px; font-size:12px; align-items:center;">
          <button id="btn-page-prev" style="background:#fff; border:1px solid #cbd5e1; border-radius:4px; padding:4px 8px; cursor:pointer; color:#334155;" ${state.currentPage === 1 ? 'disabled style="opacity:0.5"' : ''}>&lt;</button>
      `;

      if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) {
          paginationHtml += `<button class="btn-page-num" data-page="${i}" style="background:${state.currentPage === i ? '#0ea5e9' : '#fff'}; border:1px solid ${state.currentPage === i ? '#0ea5e9' : '#cbd5e1'}; border-radius:4px; padding:4px 8px; cursor:pointer; color:${state.currentPage === i ? '#fff' : '#334155'};">${i}</button>`;
        }
      } else {
        paginationHtml += `<button class="btn-page-num" data-page="1" style="background:${state.currentPage === 1 ? '#0ea5e9' : '#fff'}; border:1px solid ${state.currentPage === 1 ? '#0ea5e9' : '#cbd5e1'}; border-radius:4px; padding:4px 8px; cursor:pointer; color:${state.currentPage === 1 ? '#fff' : '#334155'};">1</button>`;
        
        if (state.currentPage > 3) {
          paginationHtml += `<span style="padding:4px; color:#64748b;">...</span>`;
        }
        
        let startPage = Math.max(2, state.currentPage - 1);
        let endPage = Math.min(totalPages - 1, state.currentPage + 1);
        
        for (let i = startPage; i <= endPage; i++) {
          paginationHtml += `<button class="btn-page-num" data-page="${i}" style="background:${state.currentPage === i ? '#0ea5e9' : '#fff'}; border:1px solid ${state.currentPage === i ? '#0ea5e9' : '#cbd5e1'}; border-radius:4px; padding:4px 8px; cursor:pointer; color:${state.currentPage === i ? '#fff' : '#334155'};">${i}</button>`;
        }
        
        if (state.currentPage < totalPages - 2) {
          paginationHtml += `<span style="padding:4px; color:#64748b;">...</span>`;
        }
        
        paginationHtml += `<button class="btn-page-num" data-page="${totalPages}" style="background:${state.currentPage === totalPages ? '#0ea5e9' : '#fff'}; border:1px solid ${state.currentPage === totalPages ? '#0ea5e9' : '#cbd5e1'}; border-radius:4px; padding:4px 8px; cursor:pointer; color:${state.currentPage === totalPages ? '#fff' : '#334155'};">${totalPages}</button>`;
      }

      paginationHtml += `
          <button id="btn-page-next" style="background:#fff; border:1px solid #cbd5e1; border-radius:4px; padding:4px 8px; cursor:pointer; color:#334155;" ${state.currentPage === totalPages ? 'disabled style="opacity:0.5"' : ''}>&gt;</button>
        </div>
      `;
      
      paginationContainer.innerHTML = paginationHtml;

      const prevBtn = paginationContainer.querySelector('#btn-page-prev');
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (state.currentPage > 1) {
            state.currentPage--;
            renderTable();
          }
        });
      }
      
      const nextBtn = paginationContainer.querySelector('#btn-page-next');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (state.currentPage < totalPages) {
            state.currentPage++;
            renderTable();
          }
        });
      }

      const numBtns = paginationContainer.querySelectorAll('.btn-page-num');
      numBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const page = parseInt(e.target.dataset.page);
          if (page && page !== state.currentPage) {
            state.currentPage = page;
            renderTable();
          }
        });
      });

    } else {
      paginationContainer.style.display = 'none';
      paginationContainer.innerHTML = '';
    }
  }

  const clearBtn = view.querySelector('#btn-clear-filters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      view.querySelector('#filter-truck-num').value = '';
      view.querySelector('#filter-plate').value = '';
      view.querySelector('#filter-date').value = '';
      view.querySelector('#filter-season').value = 'Season 25-26';
      view.querySelector('#filter-transporter').value = 'all';
      view.querySelector('#filter-missing-invoice').checked = false;
      
      state.currentPage = 1;
      renderTable();
    });
  }

  renderTable();
}
