function renderPurchaseTable(data) {
	const apps = {};

	let globalOldest = null;
	let globalNewest = null;
	let grandTotal = 0;

	data.forEach((entry) => {
		const purchase = entry.purchaseHistory;
		const priceStr = purchase.invoicePrice;
		const title = purchase.doc?.title;
		const purchaseTimeStr = purchase.purchaseTime;

		if (!priceStr || !title || ["€0.00", "$0.00"].includes(priceStr)) return;

		const price = parseFloat(priceStr.replace(/[(€|$)\s]/g, "").replace(",", "."));
		if (price === 0) return;

		const match = title.match(/\(([^)]+)\)$/);
		if (!match) return;

		const appName = match[1].trim();

		if (!apps[appName]) {
			apps[appName] = {
				total: 0,
				oldest: null,
				newest: null,
			};
		}

		apps[appName].total += price;

		const purchaseDate = new Date(purchaseTimeStr);
		if (!apps[appName].oldest || purchaseDate < apps[appName].oldest) {
			apps[appName].oldest = purchaseDate;
		}
		if (!apps[appName].newest || purchaseDate > apps[appName].newest) {
			apps[appName].newest = purchaseDate;
		}

		// update globals
		if (!globalOldest || purchaseDate < globalOldest) {
			globalOldest = purchaseDate;
		}
		if (!globalNewest || purchaseDate > globalNewest) {
			globalNewest = purchaseDate;
		}

		grandTotal += price;
	});

	function formatDuration(diffMonths) {
		if (diffMonths === 0) return "less than 1 month";
		if (diffMonths < 12) {
			return `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
		} else {
			const years = Math.floor(diffMonths / 12);
			const months = diffMonths % 12;
			let str = `${years} year${years > 1 ? "s" : ""}`;
			if (months > 0) {
				str += ` and ${months} month${months > 1 ? "s" : ""}`;
			}
			return str;
		}
	}

	function calcDiffMonths(d1, d2) {
		return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
	}

	// Sort app entries by title alphabetically
	const sortedApps = Object.entries(apps).sort(([a], [b]) => a.localeCompare(b));

	// Prepare table and results container
	const resultsContainer = document.getElementById("results");
	const table = document.createElement("table");
	table.style.borderCollapse = "collapse";
	table.style.width = "100%";

	// Table header
	const thead = document.createElement("thead");
	thead.innerHTML = `
		<tr>
			<th style="border:1px solid #ccc;padding:4px 8px;">Title</th>
			<th style="border:1px solid #ccc;padding:4px 8px;">Total spent</th>
			<th style="border:1px solid #ccc;padding:4px 8px;">Duration of spending</th>
			<th style="border:1px solid #ccc;padding:4px 8px;">Average spending per month</th>
		</tr>
	`;
	table.appendChild(thead);

	const tbody = document.createElement("tbody");

	// Add global totals row at the top
	let globalMonths = 0;
	let globalDurationStr = "";
	let avgGlobalPerMonth = 0;
	if (globalOldest && globalNewest) {
		globalMonths = calcDiffMonths(globalOldest, globalNewest);
		globalDurationStr = formatDuration(globalMonths);
		avgGlobalPerMonth = globalMonths > 0 ? grandTotal / globalMonths : grandTotal;

		const trTotal = document.createElement("tr");
		trTotal.className = "total-row";
		trTotal.style.fontWeight = "bold";
		trTotal.innerHTML = `
			<td style="border:1px solid #444;padding:4px 8px;">Total (all apps)</td>
			<td style="border:1px solid #444;padding:4px 8px;">€${grandTotal.toFixed(2)}</td>
			<td style="border:1px solid #444;padding:4px 8px;">${globalDurationStr}</td>
			<td style="border:1px solid #444;padding:4px 8px;">€${avgGlobalPerMonth.toFixed(2)}</td>
		`;
		tbody.appendChild(trTotal);
	} else {
		const trError = document.createElement("tr");
		trError.innerHTML = `
			<td colspan="4" style="border:1px solid #ccc;padding:4px 8px;color:red;">
				Unable to calculate global period (missing dates).
			</td>
		`;
		tbody.appendChild(trError);
	}

	// Add each app row
	for (const [app, info] of sortedApps) {
		const oldest = info.oldest;
		const newest = info.newest;

		let diffMonths = 0;
		if (oldest && newest) {
			diffMonths = calcDiffMonths(oldest, newest);
		}

		let durationStr = "Single date";
		if (diffMonths > 0) {
			durationStr = formatDuration(diffMonths);
		}

		let avgPerMonth = diffMonths > 0 ? info.total / diffMonths : info.total;

		const tr = document.createElement("tr");
		tr.innerHTML = `
			<td style="border:1px solid #ccc;padding:4px 8px;">${app}</td>
			<td style="border:1px solid #ccc;padding:4px 8px;">€${info.total.toFixed(2)}</td>
			<td style="border:1px solid #ccc;padding:4px 8px;">${durationStr}</td>
			<td style="border:1px solid #ccc;padding:4px 8px;">€${avgPerMonth.toFixed(2)}</td>
		`;
		tbody.appendChild(tr);
	}
	table.appendChild(tbody);

	if (resultsContainer) {
		resultsContainer.innerHTML = ""; // Clear previous content
		const wrapper = document.createElement("div");
		wrapper.className = "table-scroll-wrapper";
		wrapper.appendChild(table);
		resultsContainer.appendChild(wrapper);
	}
}
