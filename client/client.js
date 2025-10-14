const API_BASE = '/pokemon';

// create a table row
const createRow = (pokemon) => {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${pokemon.id}</td>
    <td>${pokemon.name}</td>
    <td>${pokemon.type?.join(', ') || ''}</td>
    <td>${pokemon.weaknesses?.join(', ') || ''}</td>
    <td>${pokemon.height || ''}</td>
    <td>${pokemon.weight || ''}</td>
  `;
  return tr;
};

// load and display all pokemon
async function loadPokemon(query = '') {
  try {
    const response = await fetch(`${API_BASE}${query}`, {
      headers: { Accept: 'application/json' },
    });

    const tbody = document.querySelector('#pokemon-table tbody');
    tbody.innerHTML = ''; // clear old rows

    if (response.status === 200) {
      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', data);

      const list = Array.isArray(data)
        ? data
        : data.message || data.pokemon || data.data || [];

      if (!Array.isArray(list) || list.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6">No Pokemon found.</td>`;
        tbody.appendChild(row);
        return;
      }

      list.forEach((p) => tbody.appendChild(createRow(p)));
    } else if (response.status === 204) {
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="6">No Pokemon found.</td>`;
      tbody.appendChild(row);
    } else {
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="6">Error loading Pokemon (${response.status})</td>`;
      tbody.appendChild(row);
    }
  } catch (err) {
    console.error('Error loading Pokemon:', err);
  }
}

// handle filter form
document.querySelector('#filter-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const type = document.querySelector('#type').value.trim();
  const weakness = document.querySelector('#weakness').value.trim();

  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (weakness) params.append('weakness', weakness);

  const query = params.toString() ? `?${params.toString()}` : '';
  loadPokemon(query);
});

// reset button
document.querySelector('#reset').addEventListener('click', () => {
  const form = document.querySelector('#filter-form');
  if (form && typeof form.reset === 'function') {
    form.reset();
  }
  loadPokemon();
});

// add Pokemon form
document.querySelector('#add-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    id: parseInt(document.querySelector('#add-id').value, 10),
    name: document.querySelector('#add-name').value,
    type: document.querySelector('#add-type').value
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s),
    weaknesses: document.querySelector('#add-weaknesses').value
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s),
    height: document.querySelector('#add-height').value,
    weight: document.querySelector('#add-weight').value,
  };

  const res = await fetch('/addPokemon', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (res.status === 201) {
    alert('Pokemon added successfully!');
    e.target.reset();
    loadPokemon();
  } else {
    alert(`Failed to add Pokemon (${res.status})`);
  }
});

// edit form
document.querySelector('#edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    id: parseInt(document.querySelector('#edit-id').value, 10),
    name: document.querySelector('#edit-name').value,
    type: document.querySelector('#edit-type').value
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s),
    weaknesses: document.querySelector('#edit-weaknesses').value
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s),
    height: document.querySelector('#edit-height').value,
    weight: document.querySelector('#edit-weight').value,
  };

  const res = await fetch('/editPokemon', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (res.status === 200) {
    alert('Pokemon updated successfully!');
    e.target.reset();
    loadPokemon();
  } else if (res.status === 404) {
    alert('Pokemon not found.');
  } else {
    alert(`Failed to update Pokemon (${res.status})`);
  }
});

// load data on page load
loadPokemon();
