import React, { useMemo, useState } from 'react';

const MARKET_ROWS = [
	{ token: 'Bitcoin', symbol: 'BTC', image: 'assets/images/new/01.png', price: '$53,967.089', change: '5.43%', changeUp: true, marketCap: '$93,967,200.89', supply: '21M', volume: '$93,967,200.30', filter: 'available' },
	{ token: 'Ethereum', symbol: 'ETH', image: 'assets/images/new/2.png', price: '$46,967.000', change: '0.23%', changeUp: false, marketCap: '$43,965,6200.00', supply: '0.5M', volume: '$67,967,200.00', filter: 'losers' },
	{ token: 'Tether', symbol: 'THR', image: 'assets/images/new/4.png', price: '$53,967.089', change: '6.96%', changeUp: true, marketCap: '$56,089.200', supply: '36M', volume: '$93,967,200.30', filter: 'available' },
	{ token: 'Binance Coin', symbol: 'BNC', image: 'assets/images/new/5.png', price: '$46,967.000', change: '1.90%', changeUp: false, marketCap: '$43,965,6200.00', supply: '1.9M', volume: '$56,089.200', filter: 'losers' },
	{ token: 'Solana', symbol: 'SOL', image: 'assets/images/new/4.png', price: '$29,456.09', change: '5.43%', changeUp: true, marketCap: '$93,967,200.89', supply: '27M', volume: '$46,967.30', filter: 'gainers' },
	{ token: 'Dogecoin', symbol: 'DOGE', image: 'assets/images/new/8.png', price: '$53,967.089', change: '5.43%', changeUp: true, marketCap: '$56,089.200', supply: '23M', volume: '$93,967,200.30', filter: 'gainers' },
];

const FILTERS = [
	{ id: 'all', label: 'All Tokens' },
	{ id: 'available', label: 'Available' },
	{ id: 'gainers', label: 'Gainers' },
	{ id: 'losers', label: 'Losers' },
	{ id: 'supply', label: 'T. Supply' },
];

const Cryptotable = () => {
	const [filter, setFilter] = useState('all');

	const rows = useMemo(() => {
		if (filter === 'all' || filter === 'supply') return MARKET_ROWS;
		return MARKET_ROWS.filter((row) => row.filter === filter);
	}, [filter]);

	return (
		<div className="table-section pt-80 pb-80">
			<div className="container">
				<div className="row">
					<div className="table-reponsive box">
						<div className="table-responsive-content">
							<h2>Current Market</h2>
							<span>+0.36%</span>
							<p>Market up in the last 24 hours</p>
						</div>
						<div className="mb-3">
							{FILTERS.map((item) => (
								<button
									key={item.id}
									type="button"
									className={`btn btn-sm mr-2 mb-2 ${filter === item.id ? 'btn-primary' : 'btn-outline-light'}`}
									onClick={() => setFilter(item.id)}
								>
									{item.label}
								</button>
							))}
						</div>
						<table className="table table-striped table-bordered">
							<thead>
								<tr>
									<th>Token</th>
									<th>Price</th>
									<th>24H</th>
									<th>Market Cap</th>
									<th>T. Supply</th>
									<th>24H Volume</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((row) => (
									<tr key={`${row.symbol}-${row.filter}-${row.token}`}>
										<td>
											<img src={row.image} alt="" /> {row.token} <span>{row.symbol}</span>
										</td>
										<td>{row.price}</td>
										<td>
											<img src={row.changeUp ? 'assets/images/new/0.png' : 'assets/images/new/3.png'} alt="" /> {row.change}
										</td>
										<td>{row.marketCap}</td>
										<td>{row.supply}</td>
										<td>{row.volume}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Cryptotable;
