$(document).ready(function() {
    $('#simple > ul').tagit({
        select: true,
        triggerKeys: ['comma', 'enter', 'space', 'semicolon', 'tab']
    });

    $('#autocomplete > ul').tagit({
        select: true,
        triggerKeys: ['comma', 'enter', 'space', 'semicolon', 'tab'],
        tagSource: ['one', 'two', 'three', 'four', 'five', 'six']
    });

    $('#sortable > ul').tagit({
        select: true,
        triggerKeys: ['comma', 'enter', 'space', 'semicolon', 'tab'],
        sortable: 'handle'
    });

    $('#editOnClick > ul').tagit({
        select: true,
        triggerKeys: ['comma', 'enter', 'space', 'semicolon', 'tab'],
        editOnClick: true
    });

    $('a.displaySelect').click(function() {
        var select = $(this).parent('div').find('select');
        var children = "";
        select.children().each(function(){
            children += $(this).val() + " : " + $(this).text() + "\n";
        });
        alert("Select options [value: text]...\n\n" + children);
    });

    $('ul.tagit').focusin(function() {
        if (!$(this).hasClass('selected')) {
            $(this).addClass('selected');
        }
    })
    .focusout(function(event) {
        $(this).removeClass('selected');
    });

});
