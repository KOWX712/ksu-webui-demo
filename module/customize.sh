if [ -z "$MAGISK_VER_CODE" ]; then
    # Hide action.sh if not on Magisk
    mv $MODPATH/action.sh $MODPATH/launch.sh
fi