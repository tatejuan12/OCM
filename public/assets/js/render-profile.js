var querying = false;
var aTDQMarker = null;
var aTDQString = `${url}/accountTransDataQuery?m=${aTDQMarker}&eF=false&dSS=-1&dED=-1`;
$(document).ready(function () {
	$('#loadMoreActivity').attr("disabled", true);
	querying = true;
	$.get(aTDQString, function (returnData) {
			$('#acctActivTable').html(returnData[0])
			aTDQMarker = returnData[1];
			querying = false;
			$('#loadMoreActivity').attr("disabled", false);
	}).fail(function(result) {
		customAlert.alert(result.responseText)
	});
});
$('#filterDater').on('click', function () {
	let epochS = new Date($('#transStart').val()).getTime() / 1000;
	let epochE = new Date($('#transEnd').val()).getTime() / 1000;
	if (isNaN(epochS) || isNaN(epochE)) {
		alert('please pick a start and end time')
		return;
	} else if (epochS > epochE) {
		alert('Start date must be before end date.')
		return;
	} else {
		$('#filterDater').attr('disabled', true)
		$('#loadMoreActivity').attr("disabled", true);
		$('#acctActivTable').empty()
		const url = new URL(aTDQString)
		const params1 = url.searchParams;
		params1.set('dSS', epochS); 
		params1.set('dED', epochE);
		url.search = params1.toString();
		const nURL = url.toString();
		if (!querying) {
			querying = true;
			$.get(nURL, function (returnData) {
				$('#acctActivTable').html(returnData[0])
				aTDQMarker = returnData[1];
				querying = false;
				if (returnData[1] != 'end') {
					$('#filterDater').attr('disabled', false)
					$('#loadMoreActivity').prop("hidden", false);
					$('#loadMoreActivity').attr("disabled", false);
				} else {
					$('#filterDater').attr('disabled', false)
					$('#loadMoreActivity').prop("hidden", true);
				}
			}).fail(function(result) {
				customAlert.alert(result.responseText)
			});
		}
	}
})
$('#loadMoreActivity').on('click', function(e) {
	if (aTDQMarker != 'end') {
			$(this).addClass('loading');
  			$(this).prop('disabled', true);
			aTDQMarker = JSON.stringify(aTDQMarker)
			aTDQString = `${url}/accountTransDataQuery?m=${aTDQMarker}&eF=false&dSS=-1&dED=-1`
			let S = $('#transStart').val();
			let E = $('#transEnd').val();
			if (S == '' && E == '') {
				if (!querying) {
					querying = true;
					console.log(aTDQString)		
					$.get(aTDQString, function (returnData) {
							$('#acctActivTable').append(returnData[0]);
							aTDQMarker = returnData[1];
							querying = false;
							$(window).data('getReady', true);
							if (returnData[1] != 'end') {
								$('#loadMoreActivity').prop("hidden", false);
								$('#loadMoreActivity').removeClass('loading');
								$('#loadMoreActivity').prop('disabled', false);
							} else {
								$('#loadMoreActivity').prop("hidden", true);
							}
						}
					).fail(function(result) {
						customAlert.alert(result.responseText)
					})
				}
			} else {
				let epochS = new Date($('#transStart').val()).getTime() / 1000;
				let epochE = new Date($('#transEnd').val()).getTime() / 1000;
				if (isNaN(epochS) || isNaN(epochE)) {
					alert('please pick a start and end time')
					return;
				} else if (epochS > epochE) {
					alert('Start date must be before end date.')
					return;
				} else {
					const url = new URL(aTDQString)
					const params1 = url.searchParams;
					params1.set('dSS', epochS);
					params1.set('dED', epochE);
					url.search = params1.toString();
					const nURL = url.toString();
					console.log(nURL)
					if (!querying) {
						querying = true;			
					$.get(nURL, function (returnData) {
						if (returnData == 'empty') {
							$('#acctActivTable').append('No more transaction history');
						} else {
							$('#acctActivTable').append(returnData[0])
							aTDQMarker = returnData[1];
							querying = false;
							$(window).data('getReady', true);
							if (returnData[1] != 'end') {
								$('#loadMoreActivity').prop("hidden", false);
								$('#loadMoreActivity').removeClass('loading');
								$('#loadMoreActivity').prop('disabled', false);
							} else {
								$('#loadMoreActivity').prop("hidden", true);
							}
						}
					}).fail(function(result) {
						customAlert.alert(result.responseText)
					});}
				}
			}
		}
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
function copy(text) {
	navigator.clipboard.writeText(text)
}