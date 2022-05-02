$('#value').live('change', function() {
    var total = 0;
  
    $('#value').each(function () {
      total += $(this).val();
    });
  
    $('#sum').val(total);
  });