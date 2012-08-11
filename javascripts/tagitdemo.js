$(document).ready(function() {
    $('#test').tagit({
        select: true,
        triggerKeys: ['comma', 'enter', 'space', 'semicolon', 'tab'],
        tagSource: [],
        editOnClick: true,
        initialTags: [],
        callbackOnInitialTagAdd: true
    });
});
