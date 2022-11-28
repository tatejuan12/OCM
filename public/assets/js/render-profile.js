var aTDQString = `${url}/accountTransDataQuery?m=null&eF=true&dSS=-1&dED=-1`;
var aTDQMarker = null;
$(document).ready(function () {
	console.log(aTDQString)
	$.get(aTDQString, function (returnData) {
			$('#acctActivTable').html(returnData[0])
			aTDQMarker = returnData[1];
			console.log(aTDQMarker)
	});
});
$(window).data('getReady', true).scroll(function(e) {
	if ($(window).data('getReady') == false) return;
	if (($(".row.g-5").offset().top + $(".row.g-5").height()*0.85 - $(window).height()) < $(this).scrollTop()) {
		$(window).data('getReady', false);

		$.get(aTDQString+urlFilterConstructor(),
			function(data) {
				if (data == 'empty'){
					$('#acctActivTable').html('No more transaction history');
				} else {
					iteration++;
					$("#acctActivTable").append(data);
					$(window).data('getReady', true);
				}
			}
		)
	}
})
function transactionFilters() {
	let data = {
		start: new Date($('#transStart').val()).getTime(),
		end: new Date($('#transEnd').val()).getTime()
	}
	if (data.start > data.end) {
		alert('Start date must be before end date.')
		return;
	}

}
$('#filterDater').on('click', function () {

})
function sortTable(n) {
	var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
	table = document.getElementById("activityTable");
	switching = true;
	dir = "asc";
	while (switching) {
	  switching = false;
	  rows = table.rows;
	  for (i = 1; i < (rows.length - 1); i++) {
		shouldSwitch = false;

		x = rows[i].getElementsByTagName("TD")[n];
		y = rows[i + 1].getElementsByTagName("TD")[n];

		if (dir == "asc") {
		  if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
			shouldSwitch = true;
			break;
		  }
		} else if (dir == "desc") {
		  if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
			shouldSwitch = true;
			break;
		  }
		}
	  }
	  if (shouldSwitch) {
		rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
		switching = true;
		switchcount ++;
	  } else {
		if (switchcount == 0 && dir == "asc") {
		  dir = "desc";
		  switching = true;
		}
	  }
	}
}
function sortTableNumeric(n) {
	var table, rows, switching, i, x, y, shouldSwitch;
  table = document.getElementById("activityTable");
  switching = true;
  while (switching) {
    switching = false;
    rows = table.rows;
    for (i = 1; i < (rows.length - 1); i++) {
      shouldSwitch = false;
      x = rows[i].getElementsByTagName("TD")[n];
      y = rows[i + 1].getElementsByTagName("TD")[n];
      if (Number(x.innerHTML) > Number(y.innerHTML)) {
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
}
