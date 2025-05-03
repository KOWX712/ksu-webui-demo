# Launch WebUI in KSUWebUIStandalone or MMRL or WebUI X with action.sh

MODID="ksuwebui_demo"

if pm path io.github.a13e300.ksuwebui >/dev/null 2>&1; then
    echo "- Launching WebUI in KSUWebUIStandalone..."
    am start -n "io.github.a13e300.ksuwebui/.WebUIActivity" -e id "$MODID"
elif pm path com.dergoogler.mmrl >/dev/null 2>&1; then
    echo "- Launching WebUI in MMRL WebUI..."
    am start -n "com.dergoogler.mmrl/.ui.activity.webui.WebUIActivity" -e MOD_ID "$MODID"
elif pm path com.dergoogler.mmrl.webuix > /dev/null 2>&1; then
    echo "- Launching WebUI in WebUI X..."
    am start -n "com.dergoogler.mmrl.webuix/.ui.activity.webui.WebUIActivity" -e MOD_ID "$MODID"
else
    echo "! No WebUI app found"
    exit 0
fi

echo "- WebUI launched successfully."
