(function () {
	document.addEventListener('DOMContentLoaded', function () {
		var btn = document.getElementById('hamburgerBtn');
		var menu = document.getElementById('sideMenu');
		var overlay = document.getElementById('menuOverlay');
		if (!btn || !menu || !overlay) return;

		function setOpen(open) {
			menu.classList.toggle('open', open);
			overlay.classList.toggle('open', open);
		}

		btn.addEventListener('click', function () {
			setOpen(!menu.classList.contains('open'));
		});
		overlay.addEventListener('click', function () {
			setOpen(false);
		});
	});
})();
