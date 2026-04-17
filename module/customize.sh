export MODULE_HOT_INSTALL_REQUEST="true" # Remove this if your module need restart to work properly

if [ -z "$MAGISK_VER_CODE" ]; then
    # Hide action.sh if not on Magisk
    mv $MODPATH/action.sh $MODPATH/launch.sh
fi