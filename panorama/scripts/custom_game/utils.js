
function get_hud() {
    var p = $.GetContextPanel();
    while (p !== null && p.id !== "Hud") {
        p = p.GetParent();
    }
    return p;
}


function find_hud_element(find) {
    return get_hud().FindChildTraverse(find)
}
