$(document).ready(function() {
    $('#simple').tagit({
        select: true,
        triggerKeys: ['comma', 'enter', 'space', 'semicolon', 'tab']
    });

    $('#autocomplete').tagit({
        select: true,
        triggerKeys: ['comma', 'enter', 'space', 'semicolon', 'tab'],
    });

    $('#sortable').tagit({
        select: true,
        triggerKeys: ['comma', 'enter', 'space', 'semicolon', 'tab'],
    });

    $('#paste').tagit({
        select: true,
        triggerKeys: ['comma', 'enter', 'space', 'semicolon', 'tab'],
    });

    $('#editOnClick').tagit({
        select: true,
        triggerKeys: ['comma', 'enter', 'space', 'semicolon', 'tab'],
    });
});
