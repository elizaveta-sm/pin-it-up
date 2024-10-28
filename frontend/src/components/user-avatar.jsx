import { Avatar } from 'antd';
import { getFirstLetterOfUsername } from '../utils/username-actions';
import { UserOutlined } from '@ant-design/icons';
import { useState } from 'react';

const UserAvatar = ({ username, photoURL, size=28, fontSize="1rem" }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    const handleImageLoad = () => {
      setIsLoaded(true);
    };
  
    return (
        <>
            { photoURL ? (
                <div 
                    className="relative overflow-hidden rounded-full flex-shrink-0" 
                    style={{ width: size, height: size }}
                >

                    { !isLoaded && (
                        <div className="absolute inset-0 animate-pulse bg-gray-300 rounded-full"></div>
                    ) }

                    <Avatar
                        src={photoURL}
                        alt="user avatar"
                        size={size}
                        onLoad={handleImageLoad}
                        className={`transition-opacity duration-250 ease-in-out ${
                            isLoaded ? "opacity-100" : "opacity-0"
                        }`}
                    />
                </div>
            ) : username ? (
                <Avatar
                    style={{
                    backgroundColor: "#fde3cf",
                    color: "#f56a00",
                    fontSize,
                    }}
                    size={size}
                >
                    {getFirstLetterOfUsername(username)}
                </Avatar>
            ) : (
                <Avatar icon={<UserOutlined />} alt="user avatar" size={size} />
            )}
        </>
    );
}

export default UserAvatar;