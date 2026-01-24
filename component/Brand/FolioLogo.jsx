const FolioLogo = ({ variant = 'dark', layout = 'horizontal', className = '' }) => {
	const stacked = layout === 'stacked'
	const tone = variant === 'light' ? 'light' : 'dark'

	return (
		<span className={`folio-logo folio-logo--${tone} ${stacked ? 'folio-logo--stacked' : ''} ${className}`.trim()}>
			<img src="assets/images/folio-mark.png" alt="" />
			<span className="folio-word">
				<span className="folio-name">Folio</span>
				<span className="folio-dao">DAO</span>
			</span>
		</span>
	)
}

export default FolioLogo
