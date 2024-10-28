import { useMediaQuery } from 'react-responsive';
import DesktopPin from '../components/desktop/desktop-pin';
import MobilePin from '../components/mobile/mobile-pin';
import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

const Pin = () => {
    const isDesktop = useMediaQuery({ minWidth: 1024 });
    
    const { pinId } = useParams();
    const pinStartRef = useRef(null);
    
    useEffect(() => {
        pinStartRef.current?.scrollIntoView({ 
            block: 'center', 
        });
    }, [pinId]);

    return (
        <>
            <div ref={pinStartRef} />
            { isDesktop ? <DesktopPin /> : <MobilePin /> }
        </>
    )
};

export default Pin;